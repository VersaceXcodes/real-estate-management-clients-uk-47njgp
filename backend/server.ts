// server.mjs
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

import pkg from 'pg';
const { Pool } = pkg;
const { DATABASE_URL, PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT = 5432 } = process.env;
const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: { require: true }
    })
  : new Pool({
      host: PGHOST,
      database: PGDATABASE,
      user: PGUSER,
      password: PGPASSWORD,
      port: Number(PGPORT),
      ssl: { require: true }
    });

// Import zod for inline validation
import { z } from 'zod';

// Import SendGrid mail SDK
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Import xlsx for CSV/Excel parsing
import XLSX from 'xlsx';
import fs from 'fs';

import path from 'path';
import { fileURLToPath } from 'url';

// Importing zod schemas from the schema file
import {
  userSchema,
  createUserInputSchema,
  updateUserInputSchema,
  searchUserInputSchema,
  clientSchema,
  createClientInputSchema,
  updateClientInputSchema,
  searchClientInputSchema,
  clientPropertyInterestSchema,
  createClientPropertyInterestInputSchema,
  updateClientPropertyInterestInputSchema,
  searchClientPropertyInterestInputSchema,
  propertySchema,
  createPropertyInputSchema,
  updatePropertyInputSchema,
  searchPropertyInputSchema,
  appointmentSchema,
  createAppointmentInputSchema,
  updateAppointmentInputSchema,
  searchAppointmentInputSchema,
  communicationLogSchema,
  createCommunicationLogInputSchema,
  updateCommunicationLogInputSchema,
  searchCommunicationLogInputSchema,
  clientDocumentSchema,
  createClientDocumentInputSchema,
  updateClientDocumentInputSchema,
  searchClientDocumentInputSchema,
  userSettingsSchema,
  createUserSettingsInputSchema,
  updateUserSettingsInputSchema,
  searchUserSettingsInputSchema
} from './schema.ts';

// Set up express application and middleware
const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("combined"));

// JWT secret from env variables (default used if not set)
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Multer setup for file uploads (for bulk import endpoints)
const upload = multer({ dest: './storage/' });

/*
  Middleware: authenticateToken
  Validates the incoming JWT token and attaches the decoded user to req.user.
*/
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

/*
  Route: POST /api/auth/login
  Description: Authenticates a user given username and password.
  - Validates input and then retrieves user record from DB.
  - Compares submitted password with stored hash using bcrypt.
  - Generates a JWT token upon successful authentication.
*/
app.post('/api/auth/login', async (req, res) => {
  try {
    // Define inline schema for login using zod
    const loginSchema = createUserInputSchema.pick({ username: true }).extend({
      password: createUserInputSchema.shape.password_hash
    });
    const { username, password } = loginSchema.parse(req.body);
    // Query the user by username or email
    const result = await pool.query("SELECT * FROM users WHERE username=$1 OR email=$1", [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Authentication failed" });
    }
    const userRecord = result.rows[0];
    // Compare the password using bcrypt
    const validPassword = await bcrypt.compare(password, userRecord.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: "Authentication failed" });
    }
    // Generate JWT token
    const token = jwt.sign({ id: userRecord.id, role: userRecord.role }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token, user: userRecord });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: POST /api/auth/logout
  Description: Invalidate token on client side. (For JWT, usually no server invalidation)
*/
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // In a real implementation, we might blacklist the token.
  return res.json({ message: "Logout successful" });
});

/*
  Route: POST /api/auth/forgot-password
  Description: Initiates the password reset process by sending a reset link via email.
  Now integrated with SendGrid to send an actual email.
*/
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    // Validate the email using zod
    const schema = z.object({
      email: z.string().email()
    });
    const { email } = schema.parse(req.body);
    // Generate a reset token using uuidv4
    const resetToken = uuidv4();
    // Build the reset link (using FRONTEND_URL env variable if available)
    const resetLink = `${process.env.FRONTEND_URL || "https://yourfrontend.com"}/reset-password?token=${resetToken}`;
  
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL, // Verified sender email in env variable
      subject: 'Password Reset Instructions',
      text: `Please click the following link to reset your password: ${resetLink}`,
      html: `<p>Please click <a href="${resetLink}">here</a> to reset your password.</p>`,
    };
  
    await sgMail.send(msg);
    return res.json({ message: "Password reset link sent to your email." });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: POST /api/users
  Description: Creates a new user account.
  Only accessible by admin users.
*/
app.post('/api/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden" });
  }
  try {
    const parsed = createUserInputSchema.parse(req.body);
    const id = uuidv4();
    const now = new Date().toISOString();
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(parsed.password_hash, 10);
    const result = await pool.query(
      "INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [id, parsed.username, parsed.email, hashedPassword, parsed.role, now, now]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: GET /api/users
  Description: Retrieves a paginated list of users with search and filtering options.
  Accessible to admin and manager roles.
*/
app.get('/api/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ message: "Forbidden" });
  }
  try {
    const queryParams = searchUserInputSchema.parse(req.query);
    let sql = "SELECT * FROM users";
    let conditions = [];
    let values = [];
    if (queryParams.query) {
      conditions.push(`(username ILIKE $${values.length+1} OR email ILIKE $${values.length+1})`);
      values.push(`%${queryParams.query}%`);
    }
    if (conditions.length) {
      sql += " WHERE " + conditions.join(" AND ");
    }
    sql += ` ORDER BY ${queryParams.sort_by} ${queryParams.sort_order} LIMIT $${values.length+1} OFFSET $${values.length+2}`;
    values.push(queryParams.limit, queryParams.offset);
    const result = await pool.query(sql, values);
    return res.json(result.rows);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

/*
  Route: GET /api/users/:id
  Description: Retrieves user details for a given ID.
*/
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id=$1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: PUT /api/users/:id
  Description: Updates user details.
  Only accessible by admin users.
*/
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden" });
  }
  try {
    const parsed = updateUserInputSchema.parse({ id: req.params.id, ...req.body });
    let fields = [];
    let values = [];
    let idx = 1;
    if (parsed.username) {
      fields.push(`username=$${idx++}`);
      values.push(parsed.username);
    }
    if (parsed.email) {
      fields.push(`email=$${idx++}`);
      values.push(parsed.email);
    }
    if (parsed.password_hash) {
      const hashed = await bcrypt.hash(parsed.password_hash, 10);
      fields.push(`password_hash=$${idx++}`);
      values.push(hashed);
    }
    if (parsed.role) {
      fields.push(`role=$${idx++}`);
      values.push(parsed.role);
    }
    fields.push(`updated_at=$${idx++}`);
    values.push(new Date().toISOString());
    values.push(req.params.id);
    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id=$${idx} RETURNING *`;
    const result = await pool.query(sql, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: DELETE /api/users/:id
  Description: Deletes a user account.
  Only accessible by admin users.
*/
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden" });
  }
  try {
    const result = await pool.query("DELETE FROM users WHERE id=$1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: POST /api/clients
  Description: Creates a new client record.
  Accessible by authenticated agents or admin.
*/
app.post('/api/clients', authenticateToken, async (req, res) => {
  try {
    const parsed = createClientInputSchema.parse(req.body);
    const id = uuidv4();
    const now = new Date().toISOString();
    const result = await pool.query(
      "INSERT INTO clients (id, first_name, last_name, email, phone, address, status, additional_details, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *",
      [id, parsed.first_name, parsed.last_name, parsed.email, parsed.phone, parsed.address, parsed.status, parsed.additional_details || null, now, now]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: GET /api/clients
  Description: Retrieves a list of clients with filtering and pagination.
*/
app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    const queryParams = searchClientInputSchema.parse(req.query);
    let sql = "SELECT * FROM clients";
    let conditions = [];
    let values = [];
    if (queryParams.query) {
      conditions.push(`(first_name ILIKE $${values.length+1} OR last_name ILIKE $${values.length+1} OR email ILIKE $${values.length+1})`);
      values.push(`%${queryParams.query}%`);
    }
    if (conditions.length) {
      sql += " WHERE " + conditions.join(" AND ");
    }
    sql += ` ORDER BY ${queryParams.sort_by} ${queryParams.sort_order} LIMIT $${values.length+1} OFFSET $${values.length+2}`;
    values.push(queryParams.limit, queryParams.offset);
    const result = await pool.query(sql, values);
    return res.json(result.rows);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: GET /api/clients/:id
  Description: Retrieves a specific client record.
*/
app.get('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM clients WHERE id=$1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: PUT /api/clients/:id
  Description: Updates client details.
*/
app.put('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const parsed = updateClientInputSchema.parse({ id: req.params.id, ...req.body });
    let fields = [];
    let values = [];
    let idx = 1;
    if (parsed.first_name) {
      fields.push(`first_name=$${idx++}`);
      values.push(parsed.first_name);
    }
    if (parsed.last_name) {
      fields.push(`last_name=$${idx++}`);
      values.push(parsed.last_name);
    }
    if (parsed.email) {
      fields.push(`email=$${idx++}`);
      values.push(parsed.email);
    }
    if (parsed.phone) {
      fields.push(`phone=$${idx++}`);
      values.push(parsed.phone);
    }
    if (parsed.address) {
      fields.push(`address=$${idx++}`);
      values.push(parsed.address);
    }
    if (parsed.status) {
      fields.push(`status=$${idx++}`);
      values.push(parsed.status);
    }
    if ('additional_details' in parsed) {
      fields.push(`additional_details=$${idx++}`);
      values.push(parsed.additional_details);
    }
    fields.push(`updated_at=$${idx++}`);
    values.push(new Date().toISOString());
    values.push(req.params.id);
    const sql = `UPDATE clients SET ${fields.join(", ")} WHERE id=$${idx} RETURNING *`;
    const result = await pool.query(sql, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: DELETE /api/clients/:id
  Description: Deletes a client record.
*/
app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM clients WHERE id=$1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }
    return res.json({ message: "Client deleted successfully" });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: POST /api/clients/import
  Description: Bulk import clients via CSV/Excel file upload.
  Uses multer middleware for file upload and parses the file using xlsx.
*/
app.post('/api/clients/import', authenticateToken, upload.single('file'), async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'support') {
    return res.status(403).json({ message: "Forbidden" });
  }
  try {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);
    // Clean up the uploaded file after processing
    fs.unlinkSync(filePath);
    return res.json({ message: "Bulk import completed successfully", data: jsonData });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: GET /api/clients/export
  Description: Exports client data into CSV/Excel format.
  Generates a CSV string from client data and sends it as a downloadable file.
*/
app.get('/api/clients/export', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'support') {
    return res.status(403).json({ message: "Forbidden" });
  }
  try {
    const result = await pool.query("SELECT * FROM clients");
    const clients = result.rows;
    if (clients.length === 0) {
      return res.status(404).json({ message: "No clients found for export" });
    }
    const header = Object.keys(clients[0]).join(",");
    const rows = clients.map(c => Object.values(c).join(",")).join("\n");
    const csvData = header + "\n" + rows;
    res.setHeader('Content-disposition', 'attachment; filename=clients_export.csv');
    res.set('Content-Type', 'text/csv');
    return res.send(csvData);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: POST /api/client-property-interests
  Description: Creates a new property interest record for a client.
*/
app.post('/api/client-property-interests', authenticateToken, async (req, res) => {
  try {
    const parsed = createClientPropertyInterestInputSchema.parse(req.body);
    const id = uuidv4();
    const now = new Date().toISOString();
    const result = await pool.query(
      "INSERT INTO client_property_interests (id, client_id, property_type, preferred_location, price_min, price_max, additional_notes, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
      [id, parsed.client_id, parsed.property_type, parsed.preferred_location, parsed.price_min, parsed.price_max, parsed.additional_notes, now]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: GET /api/client-property-interests
  Description: Retrieves a list of property interest records, optionally filtered by client ID.
*/
app.get('/api/client-property-interests', authenticateToken, async (req, res) => {
  try {
    let sql = "SELECT * FROM client_property_interests";
    let values = [];
    if (req.query.client_id) {
      sql += " WHERE client_id = $1";
      values.push(req.query.client_id);
    }
    const result = await pool.query(sql, values);
    return res.json(result.rows);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: GET /api/client-property-interests/:id
  Description: Retrieves a property interest record by its ID.
*/
app.get('/api/client-property-interests/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM client_property_interests WHERE id=$1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: PUT /api/client-property-interests/:id
  Description: Updates a property interest record.
*/
app.put('/api/client-property-interests/:id', authenticateToken, async (req, res) => {
  try {
    const parsed = updateClientPropertyInterestInputSchema.parse({ id: req.params.id, ...req.body });
    let fields = [];
    let values = [];
    let idx = 1;
    if (parsed.property_type) {
      fields.push(`property_type=$${idx++}`);
      values.push(parsed.property_type);
    }
    if (parsed.preferred_location) {
      fields.push(`preferred_location=$${idx++}`);
      values.push(parsed.preferred_location);
    }
    if ('price_min' in parsed) {
      fields.push(`price_min=$${idx++}`);
      values.push(parsed.price_min);
    }
    if ('price_max' in parsed) {
      fields.push(`price_max=$${idx++}`);
      values.push(parsed.price_max);
    }
    if ('additional_notes' in parsed) {
      fields.push(`additional_notes=$${idx++}`);
      values.push(parsed.additional_notes);
    }
    const sql = `UPDATE client_property_interests SET ${fields.join(", ")} WHERE id=$${idx} RETURNING *`;
    values.push(req.params.id);
    const result = await pool.query(sql, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: DELETE /api/client-property-interests/:id
  Description: Deletes a property interest record.
*/
app.delete('/api/client-property-interests/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM client_property_interests WHERE id=$1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found" });
    }
    return res.json({ message: "Record deleted successfully" });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: POST /api/properties
  Description: Creates a new property record.
*/
app.post('/api/properties', authenticateToken, async (req, res) => {
  try {
    const parsed = createPropertyInputSchema.parse(req.body);
    const id = uuidv4();
    const now = new Date().toISOString();
    const result = await pool.query(
      "INSERT INTO properties (id, address, property_type, price, status, description, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
      [id, parsed.address, parsed.property_type, parsed.price, parsed.status, parsed.description || null, now, now]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: GET /api/properties
  Description: Retrieves a list of properties with filtering and pagination.
*/
app.get('/api/properties', authenticateToken, async (req, res) => {
  try {
    const queryParams = searchPropertyInputSchema.parse(req.query);
    let sql = "SELECT * FROM properties";
    let conditions = [];
    let values = [];
    if (queryParams.query) {
      conditions.push(`(address ILIKE $${values.length+1} OR property_type ILIKE $${values.length+1})`);
      values.push(`%${queryParams.query}%`);
    }
    if (conditions.length) {
      sql += " WHERE " + conditions.join(" AND ");
    }
    sql += ` ORDER BY ${queryParams.sort_by} ${queryParams.sort_order} LIMIT $${values.length+1} OFFSET $${values.length+2}`;
    values.push(queryParams.limit, queryParams.offset);
    const result = await pool.query(sql, values);
    return res.json(result.rows);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: GET /api/properties/:id
  Description: Retrieves property details by ID.
*/
app.get('/api/properties/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM properties WHERE id=$1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Property not found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: PUT /api/properties/:id
  Description: Updates property details.
*/
app.put('/api/properties/:id', authenticateToken, async (req, res) => {
  try {
    const parsed = updatePropertyInputSchema.parse({ id: req.params.id, ...req.body });
    let fields = [];
    let values = [];
    let idx = 1;
    if (parsed.address) {
      fields.push(`address=$${idx++}`);
      values.push(parsed.address);
    }
    if (parsed.property_type) {
      fields.push(`property_type=$${idx++}`);
      values.push(parsed.property_type);
    }
    if (parsed.price) {
      fields.push(`price=$${idx++}`);
      values.push(parsed.price);
    }
    if (parsed.status) {
      fields.push(`status=$${idx++}`);
      values.push(parsed.status);
    }
    if ('description' in parsed) {
      fields.push(`description=$${idx++}`);
      values.push(parsed.description);
    }
    fields.push(`updated_at=$${idx++}`);
    values.push(new Date().toISOString());
    values.push(req.params.id);
    const sql = `UPDATE properties SET ${fields.join(", ")} WHERE id=$${idx} RETURNING *`;
    const result = await pool.query(sql, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Property not found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: DELETE /api/properties/:id
  Description: Deletes a property record.
*/
app.delete('/api/properties/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM properties WHERE id=$1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Property not found" });
    }
    return res.json({ message: "Property deleted successfully" });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: POST /api/appointments
  Description: Schedules a new appointment linking a client, agent, and optionally a property.
*/
app.post('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const parsed = createAppointmentInputSchema.parse(req.body);
    const id = uuidv4();
    const now = new Date().toISOString();
    // Format appointment_date as 'YYYY-MM-DD'
    const app_date = new Date(parsed.appointment_date).toISOString().split('T')[0];
    const result = await pool.query(
      "INSERT INTO appointments (id, client_id, property_id, agent_id, appointment_date, appointment_time, notes, is_confirmed, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *",
      [id, parsed.client_id, parsed.property_id || null, parsed.agent_id, app_date, parsed.appointment_time, parsed.notes || null, parsed.is_confirmed, now, now]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: GET /api/appointments
  Description: Retrieves a list of appointments with optional filters.
*/
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    let sql = "SELECT * FROM appointments";
    let conditions = [];
    let values = [];
    if (req.query.client_id) {
      conditions.push("client_id=$" + (values.length + 1));
      values.push(req.query.client_id);
    }
    if (req.query.agent_id) {
      conditions.push("agent_id=$" + (values.length + 1));
      values.push(req.query.agent_id);
    }
    if (req.query.date) {
      conditions.push("appointment_date=$" + (values.length + 1));
      values.push(req.query.date);
    }
    if (conditions.length) {
      sql += " WHERE " + conditions.join(" AND ");
    }
    const result = await pool.query(sql, values);
    return res.json(result.rows);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: GET /api/appointments/:id
  Description: Retrieves appointment details by ID.
*/
app.get('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM appointments WHERE id=$1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: PUT /api/appointments/:id
  Description: Updates appointment details.
*/
app.put('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const parsed = updateAppointmentInputSchema.parse({ id: req.params.id, ...req.body });
    let fields = [];
    let values = [];
    let idx = 1;
    if (parsed.client_id) {
      fields.push(`client_id=$${idx++}`);
      values.push(parsed.client_id);
    }
    if ('property_id' in parsed) {
      fields.push(`property_id=$${idx++}`);
      values.push(parsed.property_id);
    }
    if (parsed.agent_id) {
      fields.push(`agent_id=$${idx++}`);
      values.push(parsed.agent_id);
    }
    if (parsed.appointment_date) {
      fields.push(`appointment_date=$${idx++}`);
      values.push(new Date(parsed.appointment_date).toISOString().split('T')[0]);
    }
    if (parsed.appointment_time) {
      fields.push(`appointment_time=$${idx++}`);
      values.push(parsed.appointment_time);
    }
    if ('notes' in parsed) {
      fields.push(`notes=$${idx++}`);
      values.push(parsed.notes);
    }
    if ('is_confirmed' in parsed) {
      fields.push(`is_confirmed=$${idx++}`);
      values.push(parsed.is_confirmed);
    }
    fields.push(`updated_at=$${idx++}`);
    values.push(new Date().toISOString());
    values.push(req.params.id);
    const sql = `UPDATE appointments SET ${fields.join(", ")} WHERE id=$${idx} RETURNING *`;
    const result = await pool.query(sql, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: DELETE /api/appointments/:id
  Description: Deletes an appointment.
*/
app.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM appointments WHERE id=$1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    return res.json({ message: "Appointment deleted successfully" });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: POST /api/communication-logs
  Description: Creates a new communication log entry.
*/
app.post('/api/communication-logs', authenticateToken, async (req, res) => {
  try {
    const parsed = createCommunicationLogInputSchema.parse(req.body);
    const id = uuidv4();
    const result = await pool.query(
      "INSERT INTO communication_logs (id, client_id, user_id, communication_type, note, follow_up_flag, timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      [id, parsed.client_id, parsed.user_id, parsed.communication_type, parsed.note, parsed.follow_up_flag, new Date(parsed.timestamp).toISOString()]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: GET /api/communication-logs
  Description: Retrieves communication logs with optional filtering.
*/
app.get('/api/communication-logs', authenticateToken, async (req, res) => {
  try {
    let sql = "SELECT * FROM communication_logs";
    let conditions = [];
    let values = [];
    if (req.query.client_id) {
      conditions.push("client_id=$" + (values.length + 1));
      values.push(req.query.client_id);
    }
    if (req.query.communication_type) {
      conditions.push("communication_type=$" + (values.length + 1));
      values.push(req.query.communication_type);
    }
    if (conditions.length) {
      sql += " WHERE " + conditions.join(" AND ");
    }
    const result = await pool.query(sql, values);
    return res.json(result.rows);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: GET /api/communication-logs/:id
  Description: Retrieves a specific communication log entry.
*/
app.get('/api/communication-logs/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM communication_logs WHERE id=$1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Log not found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: PUT /api/communication-logs/:id
  Description: Updates a communication log entry.
*/
app.put('/api/communication-logs/:id', authenticateToken, async (req, res) => {
  try {
    const parsed = updateCommunicationLogInputSchema.parse({ id: req.params.id, ...req.body });
    let fields = [];
    let values = [];
    let idx = 1;
    if (parsed.communication_type) {
      fields.push(`communication_type=$${idx++}`);
      values.push(parsed.communication_type);
    }
    if (parsed.note) {
      fields.push(`note=$${idx++}`);
      values.push(parsed.note);
    }
    if ('follow_up_flag' in parsed) {
      fields.push(`follow_up_flag=$${idx++}`);
      values.push(parsed.follow_up_flag);
    }
    if (parsed.timestamp) {
      fields.push(`timestamp=$${idx++}`);
      values.push(new Date(parsed.timestamp).toISOString());
    }
    const sql = `UPDATE communication_logs SET ${fields.join(", ")} WHERE id=$${idx} RETURNING *`;
    values.push(req.params.id);
    const result = await pool.query(sql, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Log not found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: DELETE /api/communication-logs/:id
  Description: Deletes a communication log entry.
*/
app.delete('/api/communication-logs/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM communication_logs WHERE id=$1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Log not found" });
    }
    return res.json({ message: "Communication log deleted successfully" });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: POST /api/client-documents
  Description: Uploads a new client document record.
*/
app.post('/api/client-documents', authenticateToken, async (req, res) => {
  try {
    const parsed = createClientDocumentInputSchema.parse(req.body);
    const id = uuidv4();
    const result = await pool.query(
      "INSERT INTO client_documents (id, client_id, document_name, document_url, document_type, uploaded_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [id, parsed.client_id, parsed.document_name, parsed.document_url, parsed.document_type, parsed.uploaded_at]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: GET /api/client-documents
  Description: Retrieves a list of client documents, optionally filtered by client ID.
*/
app.get('/api/client-documents', authenticateToken, async (req, res) => {
  try {
    let sql = "SELECT * FROM client_documents";
    let values = [];
    if (req.query.client_id) {
      sql += " WHERE client_id=$1";
      values.push(req.query.client_id);
    }
    const result = await pool.query(sql, values);
    return res.json(result.rows);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: GET /api/client-documents/:id
  Description: Retrieves a client document by its ID.
*/
app.get('/api/client-documents/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM client_documents WHERE id=$1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Document not found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: PUT /api/client-documents/:id
  Description: Updates a client document record.
*/
app.put('/api/client-documents/:id', authenticateToken, async (req, res) => {
  try {
    const parsed = updateClientDocumentInputSchema.parse({ id: req.params.id, ...req.body });
    let fields = [];
    let values = [];
    let idx = 1;
    if (parsed.document_name) {
      fields.push(`document_name=$${idx++}`);
      values.push(parsed.document_name);
    }
    if (parsed.document_url) {
      fields.push(`document_url=$${idx++}`);
      values.push(parsed.document_url);
    }
    if (parsed.document_type) {
      fields.push(`document_type=$${idx++}`);
      values.push(parsed.document_type);
    }
    const sql = `UPDATE client_documents SET ${fields.join(", ")} WHERE id=$${idx} RETURNING *`;
    values.push(req.params.id);
    const result = await pool.query(sql, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Document not found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: DELETE /api/client-documents/:id
  Description: Deletes a client document record.
*/
app.delete('/api/client-documents/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM client_documents WHERE id=$1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Document not found" });
    }
    return res.json({ message: "Client document deleted successfully" });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: GET /api/user-settings/:user_id
  Description: Retrieves user settings for a specific user.
*/
app.get('/api/user-settings/:user_id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM user_settings WHERE user_id=$1", [req.params.user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Settings not found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

/*
  Route: PUT /api/user-settings/:id
  Description: Updates user settings.
*/
app.put('/api/user-settings/:id', authenticateToken, async (req, res) => {
  try {
    const parsed = updateUserSettingsInputSchema.parse({ id: req.params.id, ...req.body });
    let fields = [];
    let values = [];
    let idx = 1;
    if (parsed.dashboard_preferences) {
      fields.push(`dashboard_preferences=$${idx++}`);
      values.push(JSON.stringify(parsed.dashboard_preferences));
    }
    if (parsed.notification_settings) {
      fields.push(`notification_settings=$${idx++}`);
      values.push(JSON.stringify(parsed.notification_settings));
    }
    if (parsed.configuration) {
      fields.push(`configuration=$${idx++}`);
      values.push(JSON.stringify(parsed.configuration));
    }
    fields.push(`updated_at=$${idx++}`);
    values.push(new Date().toISOString());
    values.push(req.params.id);
    const sql = `UPDATE user_settings SET ${fields.join(", ")} WHERE id=$${idx} RETURNING *`;
    const result = await pool.query(sql, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Settings not found" });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// Serve static files from the 'public' directory and set up SPA catch-all routing.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server on the port specified in environment variables (default: 3000)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});