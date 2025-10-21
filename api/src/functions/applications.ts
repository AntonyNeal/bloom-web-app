import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import * as sql from "mssql";

// Support both connection string and individual credentials
const getConfig = (): string | sql.config => {
  const connectionString = process.env.SQL_CONNECTION_STRING;
  
  if (connectionString) {
    return connectionString;
  }
  
  return {
    server: process.env.SQL_SERVER!,
    database: process.env.SQL_DATABASE!,
    user: process.env.SQL_USER!,
    password: process.env.SQL_PASSWORD!,
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
  };
};

async function applicationsHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const method = req.method;
  const id = req.params.id;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (method === "OPTIONS") {
    return { status: 200, headers };
  }

  try {
    const config = getConfig();
    const pool = await sql.connect(config);

    if (method === "GET" && !id) {
      context.log("Fetching all applications");
      const result = await pool
        .request()
        .query("SELECT * FROM applications ORDER BY created_at DESC");
      
      return {
        status: 200,
        headers,
        jsonBody: result.recordset,
      };
    } 
    
    if (method === "GET" && id) {
      context.log(`Fetching application ${id}`);
      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT * FROM applications WHERE id = @id");
      
      if (result.recordset.length === 0) {
        return { 
          status: 404, 
          headers,
          jsonBody: { error: "Application not found" } 
        };
      }
      
      return { 
        status: 200, 
        headers,
        jsonBody: result.recordset[0] 
      };
    } 
    
    if (method === "POST") {
      context.log("Creating new application");
      const body = await req.json() as {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        ahpra_registration: string;
        specializations: string[];
        experience_years: number;
        cv_url?: string;
        certificate_url?: string;
        photo_url?: string;
        cover_letter?: string;
        qualification_type?: string;
        qualification_check?: boolean;
      };
      const {
        first_name,
        last_name,
        email,
        phone,
        ahpra_registration,
        specializations,
        experience_years,
        cv_url,
        certificate_url,
        photo_url,
        cover_letter,
        qualification_type,
        qualification_check,
      } = body;

      if (!first_name || !last_name || !email || !ahpra_registration) {
        return {
          status: 400,
          headers,
          jsonBody: { error: "Missing required fields" },
        };
      }

      const result = await pool
        .request()
        .input("first_name", sql.NVarChar, first_name)
        .input("last_name", sql.NVarChar, last_name)
        .input("email", sql.NVarChar, email)
        .input("phone", sql.NVarChar, phone || null)
        .input("ahpra_registration", sql.NVarChar, ahpra_registration)
        .input("specializations", sql.NVarChar, specializations ? JSON.stringify(specializations) : null)
        .input("experience_years", sql.Int, experience_years || 0)
        .input("cv_url", sql.NVarChar, cv_url || null)
        .input("certificate_url", sql.NVarChar, certificate_url || null)
        .input("photo_url", sql.NVarChar, photo_url || null)
        .input("cover_letter", sql.NVarChar, cover_letter || null)
        .input("qualification_type", sql.NVarChar, qualification_type || null)
        .input("qualification_check", sql.NVarChar, qualification_check ? JSON.stringify(qualification_check) : null)
        .query(`
          INSERT INTO applications (
            first_name, last_name, email, phone, ahpra_registration,
            specializations, experience_years, cv_url, certificate_url,
            photo_url, cover_letter, qualification_type, qualification_check
          )
          OUTPUT INSERTED.*
          VALUES (
            @first_name, @last_name, @email, @phone, @ahpra_registration,
            @specializations, @experience_years, @cv_url, @certificate_url,
            @photo_url, @cover_letter, @qualification_type, @qualification_check
          )
        `);

      return { 
        status: 201, 
        headers,
        jsonBody: result.recordset[0] 
      };
    } 
    
    if (method === "PUT" && id) {
      context.log(`Updating application ${id}`);
      const body = await req.json() as {
        status?: string;
        reviewed_by?: string;
      };
      const { status, reviewed_by } = body;

      if (!status) {
        return {
          status: 400,
          headers,
          jsonBody: { error: "Status is required" },
        };
      }

      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .input("status", sql.NVarChar, status)
        .input("reviewed_by", sql.NVarChar, reviewed_by || null)
        .query(`
          UPDATE applications
          SET status = @status, reviewed_by = @reviewed_by, reviewed_at = GETDATE()
          OUTPUT INSERTED.*
          WHERE id = @id
        `);

      if (result.recordset.length === 0) {
        return { 
          status: 404, 
          headers,
          jsonBody: { error: "Application not found" } 
        };
      }

      return { 
        status: 200, 
        headers,
        jsonBody: result.recordset[0] 
      };
    }
    
    return { 
      status: 405, 
      headers,
      jsonBody: { error: "Method not allowed" } 
    };
  } catch (error) {
    context.error("Error in applications handler:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return {
      status: 500,
      headers,
      jsonBody: { error: errorMessage },
    };
  }
}

app.http("applications", {
  methods: ["GET", "POST", "PUT", "OPTIONS"],
  authLevel: "anonymous",
  route: "applications/{id?}",
  handler: applicationsHandler,
});
