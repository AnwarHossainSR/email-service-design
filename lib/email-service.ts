import nodemailer from 'nodemailer'
import { logger } from './logger'

interface EmailData {
  to: string
  subject: string
  html: string
  from?: string
}

class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025'),
      secure: false, // true for 465, false for other ports
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
      // For MailHog, no auth needed
      ignoreTLS: true,
    })
  }

  async sendEmail(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const info = await this.transporter.sendMail({
        from: emailData.from || process.env.FROM_EMAIL || 'noreply@emailflow.pro',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
      })

      await logger.emailInfo('Email sent successfully', {
        to: emailData.to,
        subject: emailData.subject,
        messageId: info.messageId
      })

      return { success: true, messageId: info.messageId }
    } catch (error: any) {
      await logger.emailError('Email sending failed', error, undefined)
      return { success: false, error: error.message }
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      await logger.emailInfo('SMTP connection verified')
      return true
    } catch (error: any) {
      await logger.emailError('SMTP connection failed', error)
      return false
    }
  }
}

export const emailService = new EmailService()