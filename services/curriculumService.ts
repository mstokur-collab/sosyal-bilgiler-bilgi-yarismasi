import type { OgrenmeAlani } from '../data/curriculum';

let cachedCurriculumData: Record<string, Record<number, OgrenmeAlani[]>> | null = null;

export const getCurriculumData = async (): Promise<Record<string, Record<number, OgrenmeAlani[]>>> => {
  if (cachedCurriculumData) {
    return cachedCurriculumData;
  }
  
  const { curriculumData } = await import('../data/curriculum');
  cachedCurriculumData = curriculumData;
  return curriculumData;
};
