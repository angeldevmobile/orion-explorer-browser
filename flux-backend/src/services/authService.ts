import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import { EncryptionService } from "./encryptionService";
import { env } from "../config/env";

const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = env.JWT_EXPIRE;

export interface RegisterData {
  email: string;
  password: string;
  username: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Registrar nuevo usuario
   */
  static async register(data: RegisterData) {
    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("El email ya está registrado");
    }

    // Verificar si el username ya existe
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      throw new Error("El nombre de usuario ya está en uso");
    }

    // Hash del password
    const hashedPassword = await EncryptionService.hashPassword(data.password);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        username: data.username,
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    // Generar token
    const token = this.generateToken(user.id);

    return { user, token };
  }

  /**
   * Login de usuario
   */
  static async login(data: LoginData) {
    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error("Credenciales inválidas");
    }

    // Verificar password
    const isPasswordValid = await EncryptionService.comparePassword(
      data.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error("Credenciales inválidas");
    }

    // Generar token
    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      token,
    };
  }

  /**
   * Generar JWT token
   */
  static generateToken(userId: string): string {
    // @ts-expect-error — JWT_EXPIRES_IN es un valor ms válido ("7d", "1h"), pero @types/jsonwebtoken v9 usa StringValue
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Verificar JWT token
   */
  static verifyToken(token: string): { userId: string } {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  }
}