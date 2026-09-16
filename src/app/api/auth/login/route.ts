import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase().trim() },
  });

  // Mesma mensagem de erro em todos os casos — não dá pista se o e-mail existe.
  if (!user || !user.ativo || !(await verifyPassword(parsed.data.senha, user.senhaHash))) {
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
