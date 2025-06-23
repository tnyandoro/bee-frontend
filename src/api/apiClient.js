import apiBaseUrl from "../config";

const fetchData = async () => {
  const response = await fetch(`${apiBaseUrl}/endpoint`);
  const data = await response.json();
  return data;
};

export default fetchData;
