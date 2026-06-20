const BASE_URL = 'https://api.textbee.dev/api/v1';
const DEVICE_ID = '6a34eaab77015dcde1611414';
const API_KEY = process.env.TEXT_BEE_API || '8324da9f-a3e7-4451-91f2-06b963f65c28';

/**
 * Normalizes a phone number to standard E.164 format (+92xxxxxxxxxx for Pakistan).
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '').trim();
  
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }
  
  if (cleaned.startsWith('0')) {
    cleaned = '+92' + cleaned.slice(1);
  }
  
  if (!cleaned.startsWith('+')) {
    // If it's a 10-digit number starting with 3, assume it's Pakistani local and add +92
    if (cleaned.length === 10 && cleaned.startsWith('3')) {
      cleaned = '+92' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
}

/**
 * Sends an SMS to a recipient phone number via the TextBee SMS gateway.
 * Returns an object containing the success status and the generated SMS ID.
 */
export async function sendSMS(phone: string, message: string): Promise<{ success: boolean; smsId?: string }> {
  const normalizedPhone = normalizePhoneNumber(phone);
  console.log(`[SMS] Attempting to send to ${normalizedPhone}: "${message}"`);
  
  try {
    const response = await fetch(`${BASE_URL}/gateway/devices/${DEVICE_ID}/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        recipients: [normalizedPhone],
        message: message
      })
    });
    
    const data: any = await response.json();
    if (response.ok) {
      console.log(`[SMS] Sent successfully to ${normalizedPhone}. Response:`, data);
      const smsId = data.id || data.smsId || (data.data && (data.data.id || data.data.smsId)) || 'sms_mock_id_' + Math.random().toString(36).substr(2, 9);
      return { success: true, smsId };
    } else {
      console.error(`[SMS] Failed to send to ${normalizedPhone}. Status: ${response.status}. Response:`, data);
      return { success: false };
    }
  } catch (error) {
    console.error(`[SMS] Network or Server error sending to ${normalizedPhone}:`, error);
    return { success: false };
  }
}

/**
 * Checks the delivery status of an SMS via the TextBee gateway.
 */
export async function getSMSStatus(smsId: string): Promise<any> {
  if (!smsId || smsId.startsWith('sms_mock_id_')) {
    return { success: true, status: 'Delivered', message: 'Delivered (Simulated)' };
  }
  
  try {
    const response = await fetch(`${BASE_URL}/gateway/devices/${DEVICE_ID}/sms/${smsId}`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return { success: false, error: 'Failed to retrieve status from gateway.' };
  } catch (error: any) {
    console.error(`[SMS Status] Error fetching status for ${smsId}:`, error);
    return { success: false, error: error.message || 'Network error' };
  }
}
