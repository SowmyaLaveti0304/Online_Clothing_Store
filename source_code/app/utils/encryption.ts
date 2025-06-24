import bcrypt from 'bcryptjs'

export const createHash = async (text: string) => {
  return await bcrypt.hash(text, 10)
}

export const compareHash = async (text: string, hash: string) => {
  return await bcrypt.compare(text, hash)
}
