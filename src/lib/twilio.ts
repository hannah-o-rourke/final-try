import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER!;
const targetPhoneNumber = process.env.TARGET_PHONE_NUMBER!;

const client = twilio(accountSid, authToken);

export async function sendSMS(message: string) {
  try {
    const response = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: targetPhoneNumber,
    });
    return response;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
} 