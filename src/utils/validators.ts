import { z } from 'zod'
import { INDUSTRY_KEYS } from '@/types/industry.types'

export const emailSchema = z.string().email('Invalid email address')
export const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number')

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const signupStep1Schema = z
  .object({
    firstName:       z.string().min(1, 'First name is required'),
    lastName:        z.string().min(1, 'Last name is required'),
    email:           emailSchema,
    password:        passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const signupStep2Schema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  phone:        z.string().min(7, 'Valid phone number required'),
})

export const signupStepIndustrySchema = z.object({
  industryType: z.enum(INDUSTRY_KEYS, {
    errorMap: () => ({ message: 'Please select an industry' }),
  }),
})

export const signupStep3Schema = z.object({
  address: z.string().min(3, 'Address is required'),
  city:    z.string().min(1, 'City is required'),
  state:   z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
})

export const signupStep4Schema = z.object({
  plan: z.enum(['starter', 'growth', 'pro', 'enterprise']),
})

export const signupStep5Schema = z.object({
  acceptTerms:     z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
  acceptMarketing: z.boolean(),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const bookingSchema = z.object({
  serviceId:     z.string().min(1, 'Service is required'),
  customerName:  z.string().min(1, 'Name is required'),
  customerEmail: emailSchema,
  customerPhone: z.string().min(7, 'Phone is required'),
  date:          z.string().min(1, 'Date is required'),
  startTime:     z.string().min(1, 'Time is required'),
  notes:         z.string().optional(),
})

export const employeeSchema = z.object({
  name:       z.string().min(1, 'Name is required'),
  email:      emailSchema,
  phone:      z.string().min(7, 'Phone is required'),
  role:       z.enum(['manager', 'employee', 'part_time']),
  hourlyRate: z.number().min(0, 'Rate must be positive'),
  hireDate:   z.string().min(1, 'Hire date is required'),
})

export const serviceSchema = z.object({
  name:        z.string().min(1, 'Name is required'),
  duration:    z.number().min(15, 'Minimum 15 minutes'),
  price:       z.number().min(0, 'Price must be positive'),
  category:    z.string().min(1, 'Category is required'),
  description: z.string().optional(),
})
