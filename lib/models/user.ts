/**
 * User model interface
 * Represents a user in the system
 */
export interface User {
  id: number;
  created: Date;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
}
