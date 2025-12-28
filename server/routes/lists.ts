import { RequestHandler } from "express";
import { promises as fs } from "fs";
import path from "path";
import { SaveListsRequest, SaveListsResponse, LoadListsResponse, SavedList } from "@shared/api";

const LISTS_JSON_PATH = path.join(process.cwd(), "public", "lists.json");

/**
 * GET /api/lists - Load saved lists from file
 */
export const handleGetLists: RequestHandler = async (req, res) => {
  try {
    const content = await fs.readFile(LISTS_JSON_PATH, "utf-8");
    const data = JSON.parse(content);

    return res.json({
      lists: data.lists || [],
      success: true,
    } as LoadListsResponse);
  } catch (error) {
    // File might not exist yet, that's okay
    console.warn("Could not read lists file, starting with empty lists");
    return res.json({
      lists: [],
      success: true,
    } as LoadListsResponse);
  }
};

/**
 * POST /api/lists - Save all lists to file
 */
export const handleSaveLists: RequestHandler = async (req, res) => {
  try {
    const { lists } = req.body as SaveListsRequest;

    if (!lists || !Array.isArray(lists)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lists data",
      } as SaveListsResponse);
    }

    // Write lists to JSON file
    const data = { lists, lastUpdated: new Date().toISOString() };
    await fs.writeFile(LISTS_JSON_PATH, JSON.stringify(data, null, 2), "utf-8");

    return res.json({
      success: true,
      message: `Successfully saved ${lists.length} list(s)`,
    } as SaveListsResponse);
  } catch (error) {
    console.error("Error saving lists:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save lists",
    } as SaveListsResponse);
  }
};
