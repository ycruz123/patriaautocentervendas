import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    console.warn("[login] payload inválido:", JSON.stringify(parsed.error.flatten()));
    return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (!user) {
    console.warn(`[login] nenhum usuário com o e-mail: "${parsed.data.email}"`);
    return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
  }
  if (!user.ativo) {
    console.warn(`[login] usuário inativo: ${parsed.data.email}`);
    return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
  }
  if (!(await verifyPassword(parsed.data.senha, user.senhaHash))) {
    console.warn(`[login] senha não confere para: ${parsed.data.email}`);
    return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, nome: user.nome, role: user.role });
  response.cookies.set(
    SESSION_COOKIE.name,
    await createSessionToken({ id: user.id, email: user.email, nome: user.nome, role: user.role }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_COOKIE.maxAge,
      path: "/",
    }
  );
  return response;
}
