interface NDEFReadingEvent extends Event {
  serialNumber: string
  message: NDEFMessage
}

interface NDEFMessage {
  records: readonly NDEFRecord[]
}

interface NDEFRecord {
  recordType: string
  mediaType?: string
  id?: string
  data?: DataView
  encoding?: string
  lang?: string
  toRecords?: () => NDEFRecord[]
}

interface NDEFMessageInit {
  records: NDEFRecordInit[]
}

interface NDEFRecordInit {
  recordType: string
  data?: string | BufferSource | NDEFMessageInit
  mediaType?: string
  encoding?: string
  lang?: string
  id?: string
}

interface NDEFScanOptions {
  signal?: AbortSignal
}

interface NDEFWriteOptions {
  overwrite?: boolean
  signal?: AbortSignal
}

declare class NDEFReader extends EventTarget {
  constructor()
  scan(options?: NDEFScanOptions): Promise<void>
  write(message: string | BufferSource | NDEFMessageInit, options?: NDEFWriteOptions): Promise<void>
  makeReadOnly(options?: { signal?: AbortSignal }): Promise<void>
  onreading: ((event: NDEFReadingEvent) => void) | null
  onreadingerror: ((event: Event) => void) | null
}
