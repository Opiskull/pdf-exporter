import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { launch } from "puppeteer-core";

const httpTrigger: AzureFunction = async function(
  context: Context,
  req: HttpRequest
): Promise<any> {
  context.log("HTTP trigger function processed a request.");

  const { url, landscape } = req.body;

  if (url === undefined) {
    return {
      status: 400,
      body: "url parameter is missing"
    };
  }

  let browser = null;
  const start = Date.now();

  try {
    browser = await launch({
      executablePath: "google-chrome-unstable",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true // printo to pdf only works in headless mode currently
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });
    const buffer = await page.pdf({
      format: "A4",
      landscape: landscape,
      printBackground: true,
      margin: {
        left: 10,
        top: 10,
        right: 10,
        bottom: 10
      }
    });
    return {
      status: 200,
      headers: {
        "Content-Type": "application/pdf"
      },
      body: buffer
    };
  } catch (error) {
    return { status: 500, body: error };
  } finally {
    if (browser) {
      await browser.close();
    }
    console.log(`Image Took ${Date.now() - start}`);
  }
};

export default httpTrigger;
