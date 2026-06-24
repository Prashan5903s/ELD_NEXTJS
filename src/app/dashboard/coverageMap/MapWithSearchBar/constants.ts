// constants.ts
import axios from 'axios';
import { MarkCoordinate } from "../page";

const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export const getMarkCoordinates = async (dateStart = null, dateEnd = null, token = null): Promise<MarkCoordinate[]> => {
  try {
    if (!token) {
      console.error('No token available');
      return [];
    }

    const response = await axios.get(`${url}/assets/overview/coverage-map/${dateStart}/${dateEnd}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 200) {
      const values = response.data;

      return values.map((data: any) => {
        const loctn = JSON.parse(data[0]?.location);
        const latitude = loctn?.GeoLocation?.Latitude;
        const longitude = loctn?.GeoLocation?.Longitude;
        var address = data[1];
        var words = address.split(" ");
        var lastWord = words[words.length - 1];
        
        return { lat: latitude, lng: longitude, label: lastWord };
      });
    } else {
      console.error('Unexpected response status:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    return [];
  }
};

