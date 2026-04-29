export type Toestel = {
  _id: string
  naam?: string
}

export type Boeking = {
  _id: string
  beginDatum: string
  eindDatum: string
  status?: string
  comment?: string
  toestel?: Toestel
  toestelType?: {
    _id: string
  }
}
