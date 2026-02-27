export interface ModuleMap {
  modules: ModuleEntry[];
  designSystem: DesignSystem;
  interactions: string[];
}

export interface ModuleEntry {
  name: string;
  componentPath: string;
  description: string;
  hasRepeaters: boolean;
  hasInteractivity: boolean;
}

export interface DesignSystem {
  colors: Record<string, string>;
  fonts: string[];
  keyframes: string[];
  breakpoints: string[];
}

export interface ModuleFiles {
  moduleName: string;
  fieldsJson: string;
  metaJson: string;
  moduleHtml: string;
  moduleCss: string;
  moduleJs?: string;
}

export interface GeneratedAssets {
  sharedCss: string;
  sharedJs: string;
  template: string;
  modules: ModuleFiles[];
}

export interface AIEngine {
  /**
   * Run the full conversion: analyze source, generate all files.
   * The onProgress callback receives status messages for the UI.
   */
  convert(opts: {
    sourceDir: string;
    themePath: string;
    conversionGuide: string;
    onProgress: (step: string, detail: string) => void;
  }): Promise<GeneratedAssets>;
}
