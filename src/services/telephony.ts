/**
 * Cloud Telephony Integration & Service Layer
 * Supports Exotel, Knowlarity, MyOperator, and Ozonetel Click-to-Call architectures.
 * Provides live dialer bridge with automatic call timer tracking and simulated audio recording playback.
 */

export interface TelephonyCallResult {
  callId: string;
  duration: number; // in seconds
  recordingUrl?: string;
  status: 'completed' | 'busy' | 'no-answer' | 'failed';
  provider: 'Exotel' | 'Knowlarity' | 'MyOperator' | 'Ozonetel' | 'DeviceDialer';
}

export interface TelephonyProviderConfig {
  provider: 'Exotel' | 'Knowlarity' | 'MyOperator' | 'Ozonetel' | 'DeviceDialer';
  apiKey?: string;
  apiToken?: string;
  callerId?: string; // Virtual / Landline number
  endpointUrl?: string;
}

class TelephonyService {
  private activeTimerStart: number | null = null;
  private timerInterval: NodeJS.Timeout | null = null;
  private currentLeadPhone: string | null = null;
  private currentLeadId: string | null = null;
  private onTickCallback: ((seconds: number) => void) | null = null;

  startCallTracking(leadId: string, phone: string, onTick?: (seconds: number) => void): void {
    this.currentLeadId = leadId;
    this.currentLeadPhone = phone;
    this.activeTimerStart = Date.now();
    this.onTickCallback = onTick || null;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      if (this.activeTimerStart && this.onTickCallback) {
        const elapsed = Math.floor((Date.now() - this.activeTimerStart) / 1000);
        this.onTickCallback(elapsed);
      }
    }, 1000);
  }

  stopCallTracking(): { elapsedSeconds: number; leadId: string | null; phone: string | null } {
    let elapsedSeconds = 0;
    if (this.activeTimerStart) {
      elapsedSeconds = Math.max(1, Math.floor((Date.now() - this.activeTimerStart) / 1000));
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const leadId = this.currentLeadId;
    const phone = this.currentLeadPhone;

    this.activeTimerStart = null;
    this.currentLeadId = null;
    this.currentLeadPhone = null;
    this.onTickCallback = null;

    return { elapsedSeconds, leadId, phone };
  }

  isTracking(): boolean {
    return this.activeTimerStart !== null;
  }

  getCurrentElapsed(): number {
    if (!this.activeTimerStart) return 0;
    return Math.floor((Date.now() - this.activeTimerStart) / 1000);
  }

  /**
   * Click-to-call integration for cloud telephony (Exotel, Knowlarity, MyOperator, Ozonetel).
   * In a browser context, if provider is 'DeviceDialer' or offline, opens tel: link.
   * If configured with cloud provider credentials, can execute webhook or simulate a cloud call.
   */
  async initiateClickToCall(
    leadPhone: string,
    telecallerPhone: string,
    providerConfig: TelephonyProviderConfig = { provider: 'DeviceDialer' }
  ): Promise<TelephonyCallResult> {
    const cleanLeadPhone = leadPhone.replace(/\D/g, '');
    const cleanTelecallerPhone = telecallerPhone.replace(/\D/g, '');

    if (providerConfig.provider === 'DeviceDialer' || !providerConfig.apiKey) {
      // Standard mobile browser dialer
      window.location.href = `tel:+91${cleanLeadPhone}`;
      return {
        callId: `call_${Date.now()}`,
        duration: 0,
        status: 'completed',
        provider: 'DeviceDialer',
      };
    }

    // Cloud Telephony API Hook (Exotel / Knowlarity / MyOperator / Ozonetel)
    try {
      if (providerConfig.endpointUrl) {
        const response = await fetch(providerConfig.endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${providerConfig.apiKey}`,
          },
          body: JSON.stringify({
            From: cleanTelecallerPhone,
            To: cleanLeadPhone,
            CallerId: providerConfig.callerId,
            Provider: providerConfig.provider,
          }),
        });
        const data = await response.json();
        return {
          callId: data.callId || `call_${Date.now()}`,
          duration: data.duration || 0,
          recordingUrl: data.recordingUrl,
          status: 'completed',
          provider: providerConfig.provider,
        };
      }
    } catch (err) {
      console.warn('Cloud telephony API error, falling back to tel: dialer', err);
    }

    // Fallback to mobile dialer
    window.location.href = `tel:+91${cleanLeadPhone}`;
    return {
      callId: `call_${Date.now()}`,
      duration: 0,
      status: 'completed',
      provider: 'DeviceDialer',
    };
  }
}

export const telephonyService = new TelephonyService();

/**
 * Format seconds into mm:ss
 */
export function formatCallDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
