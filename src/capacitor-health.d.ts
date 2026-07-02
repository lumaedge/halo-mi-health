declare module "@capacitor/health" {
  export const Health: {
    queryHealthData(options: {
      dataTypes: string[]
      startDate: string
      endDate: string
    }): Promise<{ data: Array<{ dataType: string; value: number; unit: string; date: string }> }>
  }
}
