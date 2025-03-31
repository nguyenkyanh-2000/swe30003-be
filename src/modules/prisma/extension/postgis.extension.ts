import { Prisma } from '@prisma/client';
import { PrismaProvider } from '../prisma.provider';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface PointOfInterest {
  name: string;
  location: Location;
}

export const postgisExtension = Prisma.defineExtension({
  name: 'postgis-extension',
  model: {
    pointOfInterest: {
      async create<T>(
        this: T,
        params: {
          data: {
            name: string;
            latitude: number;
            longitude: number;
          };
        },
      ): Promise<PointOfInterest> {
        const { data } = params;

        // Create an object using the custom types
        const poi: PointOfInterest = {
          name: data.name,
          location: {
            latitude: data.latitude,
            longitude: data.longitude,
          },
        };

        // Insert the object into the database
        const point = `POINT(${poi.location.longitude} ${poi.location.latitude})`;
        const context = Prisma.getExtensionContext(this)
          .$parent as PrismaProvider;

        await context.$queryRaw`
          INSERT INTO "PointOfInterest" (name, location) VALUES (${poi.name}, ST_GeomFromText(${point}, 4326));
        `;

        // Return the object
        return poi;
      },

      async findClosestPoints(latitude: number, longitude: number) {
        const context = Prisma.getExtensionContext(this)
          .$parent as PrismaProvider;

        const result = await context.$queryRaw<
          {
            id: number | null;
            name: string | null;
            st_x: number | null;
            st_y: number | null;
          }[]
        >`SELECT id, name, ST_X(location::geometry), ST_Y(location::geometry) 
            FROM "PointOfInterest" 
            ORDER BY ST_DistanceSphere(location::geometry, ST_MakePoint(${longitude}, ${latitude})) DESC`;

        // Transform to our custom type
        const pois: PointOfInterest[] = result.map((data) => {
          return {
            name: data.name,
            location: {
              latitude: data.st_y || 0,
              longitude: data.st_x || 0,
            },
          };
        });

        // Return data
        return pois;
      },
    },
  },
});
