import nodemailer from "nodemailer";
import { env } from "./env.js";

function createTransporter() {
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

let transporter = null;

export function getTransporter() {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
}

export async function sendPasswordResetEmail(to, resetLink) {
  const transport = getTransporter();

  if (!transport) {
    throw new Error(
      "SMTP no configurado: revisa SMTP_USER y SMTP_PASS en backend/.env",
    );
  }

  const info = await transport.sendMail({
    from: `"Pizzería NICO" <${env("SMTP_USER")}>`,
    to,
    subject: "🍕 Recuperación de contraseña - Pizzería NICO",
    text: `Restablece tu contraseña (válido 15 min): ${resetLink}`,
    html: `
    <div style="font-family: Arial, sans-serif; background-color: #f4f5f7; padding: 20px; margin: 0;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            
            <!-- Encabezado en Texto -->
            <tr>
                <td align="center" style="padding: 30px 20px; background-color: #ffffff; border-bottom: 4px solid #D30000;">
                    <h1 style="color: #000000; font-size: 28px; margin: 0; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
                        PIZZERÍA <span style="color: #D30000;">NICO</span>
                    </h1>
                </td>
            </tr>

            <!-- Cuerpo del Correo -->
            <tr>
                <td style="padding: 40px 30px;">
                    <h2 style="color: #000000; margin-top: 0; text-align: center;">Recuperación de Contraseña</h2>
                    <p style="color: #333333; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                        ¡Hola!
                    </p>
                    <p style="color: #333333; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                        Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si fuiste tú, haz clic en el siguiente botón para crear una nueva:
                    </p>
                    
                    <!-- Botón de Acción -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        <a href="${resetLink}" style="background-color: #D30000; color: #ffffff; padding: 14px 30px; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px; display: inline-block;">
                            Restablecer mi contraseña
                        </a>
                    </div>

                    <!-- Advertencias -->
                    <p style="color: #D30000; font-size: 14px; line-height: 1.5; text-align: center; font-weight: bold; margin-bottom: 15px;">
                        Este enlace expira en 15 minutos.
                    </p>
                    <p style="color: #666666; font-size: 14px; line-height: 1.5; text-align: center; margin-bottom: 0;">
                        Si no solicitaste este cambio, puedes ignorar este correo con seguridad. Tu contraseña actual no cambiará.
                    </p>
                </td>
            </tr>

            <!-- Pie de Página -->
            <tr>
                <td align="center" style="background-color: #f9f9f9; padding: 20px; border-top: 1px solid #eeeeee;">
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                        &copy; ${new Date().getFullYear()} Pizzería NICO. Todos los derechos reservados.
                    </p>
                </td>
            </tr>
        </table>
    </div>
    `,
  });
  return info;
}

export async function sendCierreEmail({ to, subject, pdfBase64, fileName }) {
  const transport = getTransporter();

  if (!transport) {
    throw new Error(
      "SMTP no configurado: revisa SMTP_USER y SMTP_PASS en backend/.env",
    );
  }

  const info = await transport.sendMail({
    from: `"Pizzería NICO" <${env("SMTP_USER")}>`,
    to,
    subject,
    text: `${subject}\n\nSe adjunta el reporte de cierre del día.`,
    html: `
    <div style="font-family: Arial, sans-serif; background-color: #f4f5f7; padding: 20px; margin: 0;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <tr>
                <td align="center" style="padding: 30px 20px; background-color: #ffffff; border-bottom: 4px solid #D30000;">
                    <h1 style="color: #000000; font-size: 28px; margin: 0; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
                        PIZZERÍA <span style="color: #D30000;">NICO</span>
                    </h1>
                </td>
            </tr>
            <tr>
                <td style="padding: 40px 30px;">
                    <h2 style="color: #000000; margin-top: 0; text-align: center;">Reporte de Cierre</h2>
                    <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0;">
                        ${subject}
                    </p>
                    <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 20px 0 0;">
                        Se adjunta el PDF con el detalle del cierre para su revisión y archivo.
                    </p>
                </td>
            </tr>
            <tr>
                <td align="center" style="background-color: #f9f9f9; padding: 20px; border-top: 1px solid #eeeeee;">
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                        &copy; ${new Date().getFullYear()} Pizzería NICO. Todos los derechos reservados.
                    </p>
                </td>
            </tr>
        </table>
    </div>
    `,
    attachments: [
      {
        filename: fileName || `Cierre_${Date.now()}.pdf`,
        content: Buffer.from(String(pdfBase64 || ""), "base64"),
        contentType: "application/pdf",
      },
    ],
  });
  return info;
}
