/**
 * Newsletter Service
 * Handles the distribution of intelligence reports via Resend.
 */

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;

export interface Recipient {
    email: string;
    name?: string;
}

export const newsletterService = {
    /**
     * Send an intelligence report to a list of recipients
     */
    async sendNewsletter(bulletin: any, recipients: Recipient[]): Promise<any> {
        if (!RESEND_API_KEY) {
            throw new Error('VITE_RESEND_API_KEY is not configured in .env');
        }

        const title = bulletin.blocks.find((b: any) => b.type === 'title')?.value || 'Daily Intelligence Brief';
        const excerpt = bulletin.blocks.find((b: any) => b.type === 'excerpt')?.value || '';
        const body = bulletin.blocks.find((b: any) => b.type === 'markdown')?.value || '';
        
        // Construct the HTML email (Newsletter style)
        const html = `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a202c;">
                <div style="background: #800000; padding: 40px 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">PULSE-R<sup>24</sup></h1>
                    <p style="margin: 10px 0 0; font-size: 10px; text-transform: uppercase; letter-spacing: 3px;">Daily Corporate Intelligence Bulletin</p>
                </div>
                
                <div style="padding: 40px 20px;">
                    <h2 style="font-size: 20px; border-bottom: 2px solid #800000; padding-bottom: 10px; margin-bottom: 20px;">${title}</h2>
                    <p style="font-style: italic; color: #4a5568; margin-bottom: 20px;">${excerpt}</p>
                    <div style="line-height: 1.6; font-size: 14px;">
                        ${body.replace(/\n/g, '<br/>')}
                    </div>
                </div>
                
                <div style="background: #f7fafc; padding: 20px; text-align: center; font-size: 10px; color: #718096; border-top: 1px solid #e2e8f0;">
                    <p>© 2026 PULSE-R24 · STRATEGIC INTELLIGENCE DIVISION</p>
                    <p>CONFIDENTIAL · FOR AUTHORIZED RECIPIENTS ONLY</p>
                </div>
            </div>
        `;

        try {
            const results = await Promise.all(recipients.map(async (recipient) => {
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'PULSE-R24 <onboarding@resend.dev>', // Replace with verified domain in production
                        to: recipient.email,
                        subject: `Pulse-R24 Brief: ${title}`,
                        html: html
                    })
                });

                const data = await response.json();
                return { email: recipient.email, success: response.ok, id: data.id };
            }));

            return {
                success: results.every(r => r.success),
                results
            };
        } catch (error: any) {
            console.error('Newsletter send error:', error);
            throw error;
        }
    }
};
