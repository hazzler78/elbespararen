// Server-side databas för träningsdata

import { TrainingExample, PromptVersion } from './ai-training';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const TRAINING_FILE = path.join(DATA_DIR, 'training.json');
const PROMPTS_FILE = path.join(DATA_DIR, 'prompts.json');

// Skapa data-mapp om den inte finns
async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * Spara träningsexempel till fil
 */
export async function saveTrainingExample(example: TrainingExample): Promise<void> {
  try {
    await ensureDataDir();
    
    const existing = await loadTrainingExamples();
    existing.push(example);
    
    await writeFile(TRAINING_FILE, JSON.stringify(existing, null, 2));
    console.log(`[Server Database] Sparade träningsexempel: ${example.id}`);
  } catch (error) {
    console.error('[Server Database] Fel vid sparande av träningsexempel:', error);
  }
}

/**
 * Ladda träningsexempel från fil
 */
export async function loadTrainingExamples(): Promise<TrainingExample[]> {
  try {
    await ensureDataDir();
    
    if (!existsSync(TRAINING_FILE)) {
      return [];
    }
    
    const data = await readFile(TRAINING_FILE, 'utf-8');
    const examples = JSON.parse(data);
    
    return examples.map((ex: any) => ({
      ...ex,
      timestamp: new Date(ex.timestamp)
    }));
  } catch (error) {
    console.error('[Server Database] Fel vid laddning av träningsexempel:', error);
    return [];
  }
}

/**
 * Spara prompt-version till fil
 */
export async function savePromptVersion(version: PromptVersion): Promise<void> {
  try {
    await ensureDataDir();
    
    const existing = await loadPromptVersions();
    existing.push(version);
    
    await writeFile(PROMPTS_FILE, JSON.stringify(existing, null, 2));
    console.log(`[Server Database] Sparade prompt-version: ${version.id}`);
  } catch (error) {
    console.error('[Server Database] Fel vid sparande av prompt-version:', error);
  }
}

/**
 * Ladda prompt-versioner från fil
 */
export async function loadPromptVersions(): Promise<PromptVersion[]> {
  try {
    await ensureDataDir();
    
    if (!existsSync(PROMPTS_FILE)) {
      return [];
    }
    
    const data = await readFile(PROMPTS_FILE, 'utf-8');
    const versions = JSON.parse(data);
    
    return versions.map((v: any) => ({
      ...v,
      createdAt: new Date(v.createdAt)
    }));
  } catch (error) {
    console.error('[Server Database] Fel vid laddning av prompt-versioner:', error);
    return [];
  }
}

/**
 * Spara aktuell prompt-ID
 */
export async function saveCurrentPromptId(promptId: string): Promise<void> {
  try {
    await ensureDataDir();
    
    const configFile = path.join(DATA_DIR, 'config.json');
    const config = { currentPromptId: promptId };
    
    await writeFile(configFile, JSON.stringify(config, null, 2));
    console.log(`[Server Database] Sparade aktuell prompt: ${promptId}`);
  } catch (error) {
    console.error('[Server Database] Fel vid sparande av aktuell prompt:', error);
  }
}

/**
 * Ladda aktuell prompt-ID
 */
export async function loadCurrentPromptId(): Promise<string | null> {
  try {
    await ensureDataDir();
    
    const configFile = path.join(DATA_DIR, 'config.json');
    if (!existsSync(configFile)) {
      return null;
    }
    
    const data = await readFile(configFile, 'utf-8');
    const config = JSON.parse(data);
    
    return config.currentPromptId || null;
  } catch (error) {
    console.error('[Server Database] Fel vid laddning av aktuell prompt:', error);
    return null;
  }
}

/**
 * Exportera all träningsdata
 */
export async function exportTrainingData(): Promise<{
  examples: TrainingExample[];
  promptVersions: PromptVersion[];
  currentPromptId: string | null;
  exportDate: string;
}> {
  const [examples, promptVersions, currentPromptId] = await Promise.all([
    loadTrainingExamples(),
    loadPromptVersions(),
    loadCurrentPromptId()
  ]);
  
  return {
    examples,
    promptVersions,
    currentPromptId,
    exportDate: new Date().toISOString()
  };
}

/**
 * Importera träningsdata
 */
export async function importTrainingData(data: {
  examples: TrainingExample[];
  promptVersions: PromptVersion[];
  currentPromptId: string | null;
}): Promise<void> {
  try {
    await ensureDataDir();
    
    await writeFile(TRAINING_FILE, JSON.stringify(data.examples, null, 2));
    await writeFile(PROMPTS_FILE, JSON.stringify(data.promptVersions, null, 2));
    
    if (data.currentPromptId) {
      await saveCurrentPromptId(data.currentPromptId);
    }
    
    console.log('[Server Database] Träningsdata importerad');
  } catch (error) {
    console.error('[Server Database] Fel vid import av träningsdata:', error);
  }
}

/**
 * Rensa all träningsdata
 */
export async function clearTrainingData(): Promise<void> {
  try {
    await ensureDataDir();
    
    if (existsSync(TRAINING_FILE)) {
      await writeFile(TRAINING_FILE, '[]');
    }
    
    if (existsSync(PROMPTS_FILE)) {
      await writeFile(PROMPTS_FILE, '[]');
    }
    
    const configFile = path.join(DATA_DIR, 'config.json');
    if (existsSync(configFile)) {
      await writeFile(configFile, '{}');
    }
    
    console.log('[Server Database] All träningsdata rensad');
  } catch (error) {
    console.error('[Server Database] Fel vid rensning av träningsdata:', error);
  }
}

/**
 * Hämta databasstatistik
 */
export async function getDatabaseStats(): Promise<{
  totalExamples: number;
  totalPromptVersions: number;
  storageSize: number;
  lastUpdated: string | null;
}> {
  try {
    const [examples, versions] = await Promise.all([
      loadTrainingExamples(),
      loadPromptVersions()
    ]);
    
    let storageSize = 0;
    try {
      if (existsSync(TRAINING_FILE)) {
        const trainingData = await readFile(TRAINING_FILE, 'utf-8');
        storageSize += trainingData.length;
      }
      if (existsSync(PROMPTS_FILE)) {
        const promptsData = await readFile(PROMPTS_FILE, 'utf-8');
        storageSize += promptsData.length;
      }
    } catch (error) {
      console.error('[Server Database] Fel vid beräkning av lagringsstorlek:', error);
    }
    
    const lastUpdated = examples.length > 0 ? 
      new Date(Math.max(...examples.map(ex => ex.timestamp.getTime()))).toISOString() : 
      null;
    
    return {
      totalExamples: examples.length,
      totalPromptVersions: versions.length,
      storageSize,
      lastUpdated
    };
  } catch (error) {
    console.error('[Server Database] Fel vid hämtning av statistik:', error);
    return {
      totalExamples: 0,
      totalPromptVersions: 0,
      storageSize: 0,
      lastUpdated: null
    };
  }
}
