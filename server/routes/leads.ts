import { RequestHandler } from "express";
import { promises as fs } from "fs";
import path from "path";
import { AddLeadsRequest, AddLeadsResponse, Lead } from "@shared/api";

const LEADS_CSV_PATH = path.join(process.cwd(), "public", "leads.csv");

/**
 * Convert Lead objects to CSV format
 */
function leadsToCSV(leads: Lead[]): string {
  const headers = ["Name", "Industry", "Location", "Email", "Phone", "Website"];
  const rows = leads.map((lead) => [
    lead.name,
    lead.industry,
    lead.location,
    lead.email,
    lead.phone,
    lead.website,
  ]);

  return [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");
}

/**
 * Parse CSV content to Lead objects
 */
function csvToLeads(csvContent: string): Lead[] {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) return [];

  const leads: Lead[] = [];
  let id = 1;
  const validLines = lines.slice(1).filter((line) => line.trim());

  for (const line of validLines) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.replace(/^"|"$/g, "").trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.replace(/^"|"$/g, "").trim());

    if (values.length >= 6) {
      const [name, industry, location, email, phone, website] = values.slice(0, 6);
      if (name) {
        leads.push({
          id,
          name,
          industry,
          location,
          email,
          phone,
          website,
          emailUnlocked: false,
          phoneUnlocked: false,
        });
        id++;
      }
    }
  }

  return leads;
}

/**
 * GET /api/leads - Get current leads from CSV file
 */
export const handleGetLeads: RequestHandler = async (req, res) => {
  try {
    console.log(`Reading leads from: ${LEADS_CSV_PATH}`);
    const csvContent = await fs.readFile(LEADS_CSV_PATH, "utf-8");
    const leads = csvToLeads(csvContent);
    console.log(`Successfully read ${leads.length} leads from CSV`);
    res.json({ leads, success: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error reading leads CSV:", errorMsg);
    res.status(500).json({
      success: false,
      leads: [],
      error: `Failed to read leads: ${errorMsg}`
    });
  }
};

/**
 * POST /api/leads - Add/import new leads to CSV
 */
export const handleAddLeads: RequestHandler = async (req, res) => {
  try {
    const { leads: newLeads } = req.body as AddLeadsRequest;

    if (!newLeads || !Array.isArray(newLeads) || newLeads.length === 0) {
      console.warn("Invalid leads request: no leads provided");
      return res.status(400).json({
        success: false,
        message: "No leads provided",
        count: 0,
      } as AddLeadsResponse);
    }

    console.log(`Adding ${newLeads.length} leads to CSV...`);

    // Read existing CSV
    let csvContent = "";
    let existingLeads: Lead[] = [];

    try {
      csvContent = await fs.readFile(LEADS_CSV_PATH, "utf-8");
      existingLeads = csvToLeads(csvContent);
      console.log(`Read ${existingLeads.length} existing leads from CSV`);
    } catch (error) {
      // File might not exist yet, that's okay
      console.warn("Could not read existing leads CSV, starting fresh:", error);
      existingLeads = [];
    }

    // Get next ID
    const maxId = Math.max(...existingLeads.map((l) => l.id), 0);
    let nextId = maxId + 1;

    // Add new leads with updated IDs
    const leadsToAdd = newLeads.map((lead) => ({
      ...lead,
      id: nextId++,
      emailUnlocked: false,
      phoneUnlocked: false,
    }));

    // Combine all leads
    const allLeads = [...existingLeads, ...leadsToAdd];

    // Write back to CSV
    const updatedCSV = leadsToCSV(allLeads);
    console.log(`Writing ${allLeads.length} total leads to CSV (path: ${LEADS_CSV_PATH})`);
    await fs.writeFile(LEADS_CSV_PATH, updatedCSV, "utf-8");

    console.log(`Successfully added ${leadsToAdd.length} leads to CSV`);
    return res.json({
      success: true,
      message: `Successfully added ${leadsToAdd.length} leads to CSV`,
      count: leadsToAdd.length,
    } as AddLeadsResponse);
  } catch (error) {
    console.error("Error adding leads:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: `Failed to add leads: ${errorMessage}`,
      count: 0,
    } as AddLeadsResponse);
  }
};
