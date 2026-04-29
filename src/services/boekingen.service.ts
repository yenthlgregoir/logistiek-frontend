import { formatDate } from '@/utils/date'
import { boekingApi } from '@/api/boeking'

export async function fetchBoekingen(params: {
  search: string
  startDatum: string | null
  eindDatum: string | null
  type: string | null
  archief: boolean
}) {
  const res = await boekingApi.list(params)

  return res.map((b: any) => ({
    ...b,
    beginDatumFormatted: formatDate(b.beginDatum),
    eindDatumFormatted: formatDate(b.eindDatum),
  }))
}

export async function getVrijeToestellen(params: {
  beginDatum: string
  eindDatum: string
  toestelType?: string
}) {
  return boekingApi.vrijeToestellen({
    beginDatum: params.beginDatum,
    eindDatum: params.eindDatum,
    toestelType: params.toestelType ?? '',
  })
}

export async function assignToestel(boekingId: string, toestelId: string) {
  return boekingApi.assignToestel(boekingId, toestelId)
}

export async function deleteBoeking(id: string) {
  return boekingApi.remove(id)
}

export async function updateComment(id: string, comment: string) {
  return boekingApi.update(id, { comment })
}
