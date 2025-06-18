import { z } from 'zod';

/* =====================================================
   USERS SCHEMAS
===================================================== */

// Entity schema for users
export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  role: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

// Input schema for creating a user (excludes auto-generated fields)
export const createUserInputSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  email: z.string().email({ message: "Must be a valid email" }),
  password_hash: z.string().min(1, { message: "Password hash is required" }),
  role: z.string().min(1, { message: "Role is required" }),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schema for updating a user (all fields optional except id)
export const updateUserInputSchema = z.object({
  id: z.string(),
  username: z.string().min(1, { message: "Username cannot be empty" }).optional(),
  email: z.string().email({ message: "Must be a valid email" }).optional(),
  password_hash: z.string().min(1, { message: "Password hash cannot be empty" }).optional(),
  role: z.string().min(1, { message: "Role cannot be empty" }).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Query schema for searching/filtering users
export const searchUserInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['username', 'email', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type SearchUserInput = z.infer<typeof searchUserInputSchema>;


/* =====================================================
   CLIENTS SCHEMAS
===================================================== */

// Entity schema for clients
export const clientSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
  status: z.string(),
  additional_details: z.any().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Client = z.infer<typeof clientSchema>;

// Input schema for creating a client
export const createClientInputSchema = z.object({
  first_name: z.string().min(1, { message: "First name is required" }),
  last_name: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Must be a valid email" }),
  phone: z.string().min(1, { message: "Phone is required" }),
  address: z.string().min(1, { message: "Address is required" }),
  status: z.string().min(1, { message: "Status is required" }),
  additional_details: z.any().nullable().optional(),
});

export type CreateClientInput = z.infer<typeof createClientInputSchema>;

// Input schema for updating a client
export const updateClientInputSchema = z.object({
  id: z.string(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  additional_details: z.any().nullable().optional(),
});

export type UpdateClientInput = z.infer<typeof updateClientInputSchema>;

// Query schema for searching/filtering clients
export const searchClientInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['first_name', 'last_name', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type SearchClientInput = z.infer<typeof searchClientInputSchema>;


/* =====================================================
   CLIENT PROPERTY INTERESTS SCHEMAS
===================================================== */

// Entity schema for client_property_interests
export const clientPropertyInterestSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  property_type: z.string(),
  preferred_location: z.string(),
  price_min: z.number().nullable(),
  price_max: z.number().nullable(),
  additional_notes: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type ClientPropertyInterest = z.infer<typeof clientPropertyInterestSchema>;

// Input schema for creating a client property interest
export const createClientPropertyInterestInputSchema = z.object({
  client_id: z.string(),
  property_type: z.string().min(1, { message: "Property type is required" }),
  preferred_location: z.string().min(1, { message: "Preferred location is required" }),
  price_min: z.number().nullable().optional(),
  price_max: z.number().nullable().optional(),
  additional_notes: z.string().nullable().optional(),
});

export type CreateClientPropertyInterestInput = z.infer<typeof createClientPropertyInterestInputSchema>;

// Input schema for updating a client property interest
export const updateClientPropertyInterestInputSchema = z.object({
  id: z.string(),
  client_id: z.string().optional(),
  property_type: z.string().min(1).optional(),
  preferred_location: z.string().min(1).optional(),
  price_min: z.number().nullable().optional(),
  price_max: z.number().nullable().optional(),
  additional_notes: z.string().nullable().optional(),
});

export type UpdateClientPropertyInterestInput = z.infer<typeof updateClientPropertyInterestInputSchema>;

// Query schema for searching/filtering client property interests
export const searchClientPropertyInterestInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['property_type', 'preferred_location', 'created_at'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type SearchClientPropertyInterestInput = z.infer<typeof searchClientPropertyInterestInputSchema>;


/* =====================================================
   PROPERTIES SCHEMAS
===================================================== */

// Entity schema for properties
export const propertySchema = z.object({
  id: z.string(),
  address: z.string(),
  property_type: z.string(),
  price: z.number(),
  status: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Property = z.infer<typeof propertySchema>;

// Input schema for creating a property
export const createPropertyInputSchema = z.object({
  address: z.string().min(1, { message: "Address is required" }),
  property_type: z.string().min(1, { message: "Property type is required" }),
  price: z.number({ invalid_type_error: "Price must be a number" }),
  status: z.string().min(1, { message: "Status is required" }),
  description: z.string().nullable().optional(),
});

export type CreatePropertyInput = z.infer<typeof createPropertyInputSchema>;

// Input schema for updating a property
export const updatePropertyInputSchema = z.object({
  id: z.string(),
  address: z.string().min(1).optional(),
  property_type: z.string().min(1).optional(),
  price: z.number().optional(),
  status: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
});

export type UpdatePropertyInput = z.infer<typeof updatePropertyInputSchema>;

// Query schema for searching/filtering properties
export const searchPropertyInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['address', 'price', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type SearchPropertyInput = z.infer<typeof searchPropertyInputSchema>;


/* =====================================================
   APPOINTMENTS SCHEMAS
===================================================== */

// Entity schema for appointments
export const appointmentSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  property_id: z.string().nullable(),
  agent_id: z.string(),
  appointment_date: z.coerce.date(),
  appointment_time: z.string(),
  notes: z.string().nullable(),
  is_confirmed: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Appointment = z.infer<typeof appointmentSchema>;

// Input schema for creating an appointment
export const createAppointmentInputSchema = z.object({
  client_id: z.string(),
  // property_id is optional and nullable because it can be omitted
  property_id: z.string().nullable().optional(),
  agent_id: z.string(),
  appointment_date: z.coerce.date(),
  appointment_time: z.string().min(1, { message: "Appointment time is required" }),
  notes: z.string().nullable().optional(),
  is_confirmed: z.boolean().default(false),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentInputSchema>;

// Input schema for updating an appointment
export const updateAppointmentInputSchema = z.object({
  id: z.string(),
  client_id: z.string().optional(),
  property_id: z.string().nullable().optional(),
  agent_id: z.string().optional(),
  appointment_date: z.coerce.date().optional(),
  appointment_time: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
  is_confirmed: z.boolean().optional(),
});

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentInputSchema>;

// Query schema for searching/filtering appointments
export const searchAppointmentInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['appointment_date', 'appointment_time', 'created_at']).default('appointment_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type SearchAppointmentInput = z.infer<typeof searchAppointmentInputSchema>;


/* =====================================================
   COMMUNICATION LOGS SCHEMAS
===================================================== */

// Entity schema for communication_logs
export const communicationLogSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  user_id: z.string(),
  communication_type: z.string(),
  note: z.string(),
  follow_up_flag: z.boolean(),
  timestamp: z.coerce.date(),
});

export type CommunicationLog = z.infer<typeof communicationLogSchema>;

// Input schema for creating a communication log
export const createCommunicationLogInputSchema = z.object({
  client_id: z.string(),
  user_id: z.string(),
  communication_type: z.string().min(1, { message: "Communication type is required" }),
  note: z.string().min(1, { message: "Note is required" }),
  follow_up_flag: z.boolean().default(false),
  timestamp: z.coerce.date(),
});

export type CreateCommunicationLogInput = z.infer<typeof createCommunicationLogInputSchema>;

// Input schema for updating a communication log
export const updateCommunicationLogInputSchema = z.object({
  id: z.string(),
  client_id: z.string().optional(),
  user_id: z.string().optional(),
  communication_type: z.string().min(1).optional(),
  note: z.string().min(1).optional(),
  follow_up_flag: z.boolean().optional(),
  timestamp: z.coerce.date().optional(),
});

export type UpdateCommunicationLogInput = z.infer<typeof updateCommunicationLogInputSchema>;

// Query schema for searching/filtering communication logs
export const searchCommunicationLogInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['communication_type', 'timestamp']).default('timestamp'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type SearchCommunicationLogInput = z.infer<typeof searchCommunicationLogInputSchema>;


/* =====================================================
   CLIENT DOCUMENTS SCHEMAS
===================================================== */

// Entity schema for client_documents
export const clientDocumentSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  document_name: z.string(),
  document_url: z.string().url({ message: "Must be a valid URL" }),
  document_type: z.string(),
  uploaded_at: z.coerce.date(),
});

export type ClientDocument = z.infer<typeof clientDocumentSchema>;

// Input schema for creating a client document
export const createClientDocumentInputSchema = z.object({
  client_id: z.string(),
  document_name: z.string().min(1, { message: "Document name is required" }),
  document_url: z.string().url({ message: "Must be a valid URL" }),
  document_type: z.string().min(1, { message: "Document type is required" }),
});

export type CreateClientDocumentInput = z.infer<typeof createClientDocumentInputSchema>;

// Input schema for updating a client document
export const updateClientDocumentInputSchema = z.object({
  id: z.string(),
  client_id: z.string().optional(),
  document_name: z.string().min(1).optional(),
  document_url: z.string().url({ message: "Must be a valid URL" }).optional(),
  document_type: z.string().min(1).optional(),
});

export type UpdateClientDocumentInput = z.infer<typeof updateClientDocumentInputSchema>;

// Query schema for searching/filtering client documents
export const searchClientDocumentInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['document_name', 'uploaded_at']).default('uploaded_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type SearchClientDocumentInput = z.infer<typeof searchClientDocumentInputSchema>;


/* =====================================================
   USER SETTINGS SCHEMAS
===================================================== */

// Entity schema for user_settings
export const userSettingsSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  dashboard_preferences: z.any().nullable(),
  notification_settings: z.any().nullable(),
  configuration: z.any().nullable(),
  updated_at: z.coerce.date(),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;

// Input schema for creating user settings
export const createUserSettingsInputSchema = z.object({
  user_id: z.string(),
  dashboard_preferences: z.any().nullable().optional(),
  notification_settings: z.any().nullable().optional(),
  configuration: z.any().nullable().optional(),
});

export type CreateUserSettingsInput = z.infer<typeof createUserSettingsInputSchema>;

// Input schema for updating user settings
export const updateUserSettingsInputSchema = z.object({
  id: z.string(),
  user_id: z.string().optional(),
  dashboard_preferences: z.any().nullable().optional(),
  notification_settings: z.any().nullable().optional(),
  configuration: z.any().nullable().optional(),
});

export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsInputSchema>;

// Query schema for searching/filtering user settings
export const searchUserSettingsInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['updated_at']).default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type SearchUserSettingsInput = z.infer<typeof searchUserSettingsInputSchema>;