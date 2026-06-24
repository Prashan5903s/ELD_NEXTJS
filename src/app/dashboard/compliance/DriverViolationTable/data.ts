import { faker } from "@faker-js/faker";

export type Driver = {
  driver: string;
  hoursInViolation: string;
};

const range = (len: number) => {
  const arr: number[] = [];
  for (let i = 0; i < len; i++) {
    arr.push(i);
  }
  return arr;
};

function generateTimeDuration() {
  const hours = faker.number.int({ min: 0, max: 23 });
  const minutes = faker.number.int({ min: 0, max: 59 });
  return `${hours}h ${minutes}m`;
}

const Violations = (): Driver => {
  return {
    driver: faker.person.firstName(),
    hoursInViolation: generateTimeDuration(),
  };
};

export function makeData(...lens: number[]) {
  const makeDataLevel = (depth = 0): Driver[] => {
    const len = lens[depth]!;
    return range(len).map((d): Driver => {
      return {
        ...Violations(),
      };
    });
  };

  return makeDataLevel();
}

export const tableData = [
  makeData(100).slice(0, 50),
  makeData(100).slice(51, 99),
];
