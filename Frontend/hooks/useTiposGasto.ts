"use client"

import { useState, useEffect } from "react"
import { tiposGastoApi } from "@/lib/api"
import type { TipoGasto } from "@/lib/types"

let cache: TipoGasto[] | null = null
let cachePromise: Promise<TipoGasto[]> | null = null

export function useTiposGasto() {
  const [tipos, setTipos] = useState<TipoGasto[]>(cache ?? [])
  const [loading, setLoading] = useState(cache === null)

  useEffect(() => {
    if (cache !== null) {
      setTipos(cache)
      setLoading(false)
      return
    }
    if (!cachePromise) {
      cachePromise = tiposGastoApi.list()
    }
    cachePromise.then((data) => {
      cache = data
      setTipos(data)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  const tiposActivos = tipos.filter((t) => t.activo)

  function getIcono(nombre: string): string {
    return tipos.find((t) => t.nombre === nombre)?.icono ?? "FileText"
  }

  function invalidate() {
    cache = null
    cachePromise = null
    setLoading(true)
    tiposGastoApi.list().then((data) => {
      cache = data
      setTipos(data)
      setLoading(false)
    })
  }

  return { tipos, tiposActivos, loading, getIcono, invalidate }
}
