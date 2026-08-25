import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, "Nama lengkap harus diisi (minimal 2 karakter)"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter")
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Server-side validation
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Validasi gagal',
        errors: validationResult.error.issues
      }, { status: 400 });
    }

    const { name, email, password } = validationResult.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.'
      }, { status: 409 });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user (role will be BUYER by default as per Prisma schema)
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'BUYER' // Explicitly set, just to be safe and clear. Never allow ADMIN here.
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    }, { status: 500 });
  }
}
