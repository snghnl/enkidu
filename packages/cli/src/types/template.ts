export interface Template {
  name: string;
  description: string;
  content: string;
  isBuiltIn: boolean;
}

export interface TemplateVariables {
  title: string;
  date: string;
  slug: string;
  [key: string]: any;
}
