import { InternalUserModel } from "../models/InternalUserModel.js";
import { z } from "zod";
import { SALT_ROUNDS } from "../config.js";
import { EMAIL_USER, EMAIL_PASS } from "../config.js";
import jwt from "jsonwebtoken";
import { SECRET_JWT_KEY } from "../config.js";

import nodemailer from "nodemailer";
import bcrypt from "bcrypt";

export class InternalUserController {

    // GET METHODS

    static async getInternalUsers(req, res) {
        try {
            const internalUsers = await InternalUserModel.getAll();
            res.json(internalUsers);
        } catch (error) {
            res.status(500).json(error);
        }
    }

    static async getById(req, res) {
        const { id } = req.params;
        try {
            const internalUser = await InternalUserModel.getById(id);
            if (internalUser) return res.json(internalUser);
            res.status(404).json({ message: "Internal user not found" });
        } catch (error) {
            res.status(500).json(error);
        }
    }

    static async getByEmail(req, res) {
        const { email } = req.params;
        try {
          const internalUser = await InternalUserModel.getByEmail(email);
          if (internalUser) {
            return res.json(internalUser);
          } else {
            res.status(404).json({ message: "Usuario interno no encontrado" });
          }
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      }

    // CREATE, UPDATE AND DELETE METHODS

    static async createInternalUser(req, res) {
        try {
            // Definir el esquema de validación con Zod
            const internalUserSchema = z.object({
                Internal_ID:  z.string().min(1, { message: "El ID es obligatorio" }),
                Internal_Name: z.string().min(1, { message: "El nombre es obligatorio" }),
                Internal_LastName: z.string().min(1, { message: "El apellido es obligatorio" }),
                Internal_Email: z.string().email({ message: "Correo no válido" }),
                Internal_Password: z.string().min(1, { message: "La contraseña es obligatoria" }),
                Internal_Type: z.string().min(1, { message: "El tipo es obligatorio" }),
                Internal_Area: z.string().min(1, { message: "El area es obligatoria" }),
                Internal_Phone: z.string().length(10, { message: "El teléfono debe tener 10 caracteres" }),
                Internal_Status: z.string().min(1, { message: "El estado es obligatorio" }).default(""),
                Internal_Huella: z.any().optional().nullable() // <-- Campo opcional y nullable

            });

            // Validar el request body
            const parseResult = internalUserSchema.safeParse(req.body);
            if (!parseResult.success) {
              const errorMessages = parseResult.error.errors.map((err) => err.message).join(', ');
              return res.status(400).json({ message: errorMessages });
            }
        
            // Extraer los datos validados
            const data = parseResult.data;
        
            // Verificar si ya existe un usuario con esa cédula
            const existingID = await InternalUserModel.getById(data.Internal_ID);
            if (existingID) {
              return res.status(401).json({ message: "Ya existe un usuario con esa cédula" });
            }
        
            // Verificar si ya existe un usuario con ese correo
            const existingEmail = await InternalUserModel.getByEmail(data.Internal_Email);
            if (existingEmail) {
              return res.status(401).json({ message: "Ya existe un usuario con ese correo" });
            }
        
            // Hashear la contraseña
            const hashedPassword = await bcrypt.hash(data.Internal_Password, SALT_ROUNDS);
            data.Internal_Password = hashedPassword;
        
            // Crear el usuario
            const internalUser = await InternalUserModel.create(data);
            return res.status(201).json(internalUser);
          } catch (error) {
            return res.status(500).json({ error: error.message });
          }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const updatedInternalUser = await InternalUserModel.update(id, req.body);
            if (!updatedInternalUser) return res.status(404).json({ message: "Internal user not found" });

            return res.json(updatedInternalUser);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const deletedInternalUser = await InternalUserModel.delete(id);
            if (!deletedInternalUser) return res.status(404).json({ message: "Internal user not found" });

            return res.json({ message: "Internal user deleted", internalUser: deletedInternalUser });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // LOGIN METHOD

    static async login(req, res) {
        try {
            // Validación con Zod
            const loginSchema = z.object({
                Internal_Email: z.string().email({ message: "Correo no válido" }),
                Internal_Password: z.string().min(1, { message: "La contraseña es obligatoria" })
            });
  
            const parseResult = loginSchema.safeParse(req.body);
            if (!parseResult.success) {
                const errorMessages = parseResult.error.errors.map(err => err.message).join(", ");
                return res.status(400).json({ message: errorMessages });
            }
  
            const { Internal_Email, Internal_Password } = parseResult.data;
  
            // Autenticar usuario
            const token = await InternalUserModel.authenticate(Internal_Email, Internal_Password);
            if (!token) {
                return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
            }
  
            return res
                .cookie("access_token", token, {
                    httpOnly: true,
                    sameSite: false,
                    secure: false, // En producción, cambiar a true para que funcione solo en HTTPS
                    maxAge: 6 * 60 * 60 * 1000 // 6 horas
                })
                .json({ token });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }


    static async logout(req, res) {
        return res.clearCookie("access_token").json({ message: "Logout successful" });
    }

    // RESET PASSWORD METHODS

    //requestResetPassword: Solicita un cambio de contraseña, enviando un código de verificación al correo
    static async requestResetPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: "El email es obligatorio" });
            }
  
            const user = await InternalUserModel.getByEmail(email);
            if (!user) {
                return res.status(400).json({ message: "El email no está registrado" });
            }
  
            // Generar código de 6 dígitos
            const code = Math.floor(100000 + Math.random() * 900000).toString();
  
            // Guardar código en la base de datos
            await InternalUserModel.saveResetCode(user.Internal_ID, code);
  
            // Configurar el transporte de correo
            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: { user: EMAIL_USER, pass: EMAIL_PASS },
            });
  
            // Enviar el correo con el código
            const mailOptions = {
              from: '"Support Balanza Web" <anakin7456@gmail.com>',
              to: email,
              subject: '🔒 Código para reiniciar contraseña',
              html: `
              <html>
                <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                  <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <h2 style="text-align: center; color: #4a90e2;">🔒 Recupera tu contraseña</h2>
                    <p>Hola,</p>
                    <p>Hemos recibido una solicitud para restablecer tu contraseña. Utiliza el siguiente código para continuar:</p>
                    <p style="text-align: center; font-size: 28px; font-weight: bold; color: #4a90e2; margin: 20px 0;">${code}</p>
                    <p>Este código expirará en <strong>15 minutos</strong>.</p>
                    <p>Si no solicitaste este cambio, ignora este mensaje.</p>
                    <p>Saludos cordiales,</p>
                    <p><em>El equipo de Tu App</em></p>
                  </div>
                </body>
              </html>
              `
            };   
  
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.error("Error al enviar email:", error);
                return res.status(500).json({ message: "Error al enviar el correo.", error });
              }
              return res.status(200).json({ message: "En caso de estar registrado este email, se enviará un código de verificación." });
            });
        } catch (error) {
            return res.status(500).json({ message: "Error al solicitar el código", error: error.message });
        }
    }


    //verifyCode: Verifica si el código de reseteo es válido
    static async verifyCode(req, res) {
        try {
            const { email, code } = req.body;
            if (!email || !code) {
                return res.status(400).json({ message: "Email y código son obligatorios" });
            }
  
            const isValid = await InternalUserModel.verifyResetCode(email, code);
            if (!isValid) {
                return res.status(400).json({ message: "Código inválido o expirado" });
            }
  
            return res.status(200).json({ message: "Código válido" });
        } catch (error) {
            return res.status(500).json({ message: "Error al verificar el código", error: error.message });
        }
    }

    //resetPassword: Cambia la contraseña del usuario, recibiendo el email, el código y la nueva contraseña (Usando el código de reseteo)
    static async resetPassword(req, res) {
        try {
            const { email, code, newPassword } = req.body;
            if (!email || !code || !newPassword) {
                return res.status(400).json({ message: "Todos los campos son obligatorios" });
            }
  
            // Verificar código antes de permitir el cambio de contraseña
            const isValid = await InternalUserModel.verifyResetCode(email, code);
            if (!isValid) {
                return res.status(400).json({ message: "Código inválido o expirado" });
            }
  
            // Actualizar contraseña
            const updated = await InternalUserModel.updatePassword(email, newPassword);
            if (!updated) {
                return res.status(400).json({ message: "Error al actualizar la contraseña" });
            }
  
            // Eliminar el código de reseteo usado
            await InternalUserModel.deleteResetCode(email);
  
            return res.status(200).json({ message: "Contraseña actualizada correctamente" });
        } catch (error) {
            return res.status(500).json({ message: "Error al restablecer la contraseña", error: error.message });
        }
    }

    //changePassword: Cambia la contraseña del usuario, recibiendo el email y la nueva contraseña (Usando la contraseña actual)
    static async changePassword(req, res) {
        try {
            const { email, currentPassword, newPassword } = req.body;
            if (!email || !currentPassword || !newPassword) {
                return res.status(400).json({ message: "Todos los campos son obligatorios" });
            }
  
            // Verificar la contraseña actual
            const isValid = await InternalUserModel.authenticate(email, currentPassword);
            if (!isValid) {
                return res.status(400).json({ message: "Contraseña actual incorrecta" });
            }
  
            // Actualizar la contraseña
            const updated = await InternalUserModel.updatePassword(email, newPassword);
            if (!updated) {
                return res.status(400).json({ message: "Error al actualizar la contraseña" });
            }
  
            return res.status(200).json({ message: "Contraseña actualizada correctamente" });
        } catch (error) {
            return res.status(500).json({ message: "Error al cambiar la contraseña", error: error.message });
        }
    }


}
