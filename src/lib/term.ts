/** Terminal output model shared by config files and the command registry. */
export interface Seg {
  /** text to print */
  t: string;
  /** space-separated classes: red, dim, b, ok, err */
  cls?: string;
  /** makes the segment an external link */
  href?: string;
  /** makes the segment clickable: runs this command in the terminal */
  cmd?: string;
}
/** A line is plain text or a list of styled segments. */
export type Line = string | Seg[];
