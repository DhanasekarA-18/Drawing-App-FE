import { v4 as uuidv4 } from "uuid";

const getUserId = () => {
  const USER_ID_KEY = "userId";
  let userId = sessionStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = uuidv4();
    sessionStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

export default getUserId;
