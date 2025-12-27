import mysql from "mysql2/promise";

const main = async () => {
  console.log("Testing database connection...");
  try {
    const conn = await mysql.createConnection({
      host: "tramway.proxy.rlwy.net",
      port: 58738,
      user: "root",
      password: "idRGFXKeHAcBOCBMYXorrjhGyYmfTPEp",
      ssl: { rejectUnauthorized: false },
    });
    const [rows] = await conn.query("SELECT 1 AS result");
    console.log("DB OK:", rows);
    await conn.end();
  } catch (err) {
    console.error("DB ERROR:", err.message);
    process.exit(1);
  }
};

main();
