import app from "./app";
import { setLastScannedDate } from "./utils/helpers";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on the port ${PORT}`);
  // setLastScannedDate();
});
