import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from "mssql";

const config: sql.config = {
  server: process.env.SQL_SERVER!,
  database: process.env.SQL_DATABASE!,
  user: process.env.SQL_USER!,
  password: process.env.SQL_PASSWORD!,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const method = req.method;
  const id = context.bindingData.id;

  // Set CORS headers
  context.res = {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  };

  // Handle preflight requests
  if (method === "OPTIONS") {
    context.res.status = 200;
    return;
  }

  try {
    const pool = await sql.connect(config);

    if (method === "GET" && !id) {
      // List all applications
      context.log("Fetching all applications");
      const result = await pool
        .request()
        .query("SELECT * FROM applications ORDER BY created_at DESC");
      
      context.res = {
        ...context.res,
        status: 200,
        body: result.recordset,
      };
    } else if (method === "GET" && id) {
      // Get single application
      context.log(`Fetching application ${id}`);
      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT * FROM applications WHERE id = @id");
      
      if (result.recordset.length === 0) {
        context.res = { 
          ...context.res,
          status: 404, 
          body: { error: "Application not found" } 
        };
      } else {
        context.res = { 
          ...context.res,
          status: 200, 
          body: result.recordset[0] 
        };
      }
    } else if (method === "POST") {
      // Create new application
      context.log("Creating new application");
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
      } = req.body;

      // Validate required fields
      if (!first_name || !last_name || !email || !ahpra_registration) {
        context.res = {
          ...context.res,
          status: 400,
          body: { error: "Missing required fields" },
        };
        return;
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
        .query(`
          INSERT INTO applications (
            first_name, last_name, email, phone, ahpra_registration,
            specializations, experience_years, cv_url, certificate_url,
            photo_url, cover_letter
          )
          OUTPUT INSERTED.*
          VALUES (
            @first_name, @last_name, @email, @phone, @ahpra_registration,
            @specializations, @experience_years, @cv_url, @certificate_url,
            @photo_url, @cover_letter
          )
        `);

      context.res = { 
        ...context.res,
        status: 201, 
        body: result.recordset[0] 
      };
    } else if (method === "PUT" && id) {
      // Update application (for admin review)
      context.log(`Updating application ${id}`);
      const { status, reviewed_by } = req.body;

      if (!status) {
        context.res = {
          ...context.res,
          status: 400,
          body: { error: "Status is required" },
        };
        return;
      }

      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .input("status", sql.NVarChar, status)
        .input("reviewed_by", sql.NVarChar, reviewed_by || null)
        .query(`
          UPDATE applications 
          SET status = @status, 
              reviewed_by = @reviewed_by,
              reviewed_at = GETDATE(),
              updated_at = GETDATE()
          OUTPUT INSERTED.*
          WHERE id = @id
        `);

      if (result.recordset.length === 0) {
        context.res = {
          ...context.res,
          status: 404,
          body: { error: "Application not found" },
        };
      } else {
        context.res = { 
          ...context.res,
          status: 200, 
          body: result.recordset[0] 
        };
      }
    } else {
      context.res = {
        ...context.res,
        status: 405,
        body: { error: "Method not allowed" },
      };
    }
  } catch (error: any) {
    context.log.error("Database error:", error);
    
    // Handle duplicate email error
    if (error.number === 2627) {
      context.res = {
        ...context.res,
        status: 409,
        body: { error: "An application with this email already exists" },
      };
    } else {
      context.res = {
        ...context.res,
        status: 500,
        body: { error: "Internal server error", details: error.message },
      };
    }
  }
};

export default httpTrigger;
