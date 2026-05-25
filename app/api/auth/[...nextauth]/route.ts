import { handlers } from "@/auth";
import { NextResponse } from "next/server";

const oidcOff = process.env.OIDC_ENABLED !== "true";
const notFound = () => NextResponse.json({}, { status: 404 });

export const GET = oidcOff ? notFound : handlers.GET;
export const POST = oidcOff ? notFound : handlers.POST;
