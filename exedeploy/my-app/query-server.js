async function main() {
  try {
    console.log("Fetching GET /api/visitors...");
    const getRes = await fetch("http://localhost:3000/api/visitors");
    const getData = await getRes.json();
    console.log("GET response:", getData);

    console.log("Fetching POST /api/visitors/increment...");
    const postRes = await fetch("http://localhost:3000/api/visitors/increment", { method: "POST" });
    const postData = await postRes.json();
    console.log("POST response:", postData);

    console.log("Fetching GET /api/visitors again...");
    const getRes2 = await fetch("http://localhost:3000/api/visitors");
    const getData2 = await getRes2.json();
    console.log("GET response 2:", getData2);
  } catch (err) {
    console.error("Error fetching server:", err);
  }
}
main();
