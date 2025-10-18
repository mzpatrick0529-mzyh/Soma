import { importWeChatData } from "./src/importers/wechat.ts";

const userId = "test_wechat_user";
const dataDir = "./uploads/extracted_import_1760644792278_vaff08kljb";

console.log("Starting WeChat import test...");
try {
  const stats = await importWeChatData(userId, dataDir);
  console.log("Import completed successfully!");
  console.log("Stats:", stats);
} catch (error) {
  console.error("Import failed:", error);
}
