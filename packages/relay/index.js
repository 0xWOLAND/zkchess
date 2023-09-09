import express from "express";
import * as fs from 'fs'

{
    const app = express();
    const port = process.
}

async function importFunctionDirectory(dirname, state) {
    const routeDir = path.join(__dirname, dirname)
    const routes = await fs.promises.readdir(routeDir);
}
