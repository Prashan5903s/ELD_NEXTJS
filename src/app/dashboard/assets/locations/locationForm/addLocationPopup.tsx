'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'react-toastify'

import 'react-toastify/dist/ReactToastify.css'

import LoadingIcons from 'react-loading-icons'
import { useSession } from 'next-auth/react'
import Skeleton from 'react-loading-skeleton'

import 'react-loading-skeleton/dist/skeleton.css'

import { useJsApiLoader, GoogleMap } from '@react-google-maps/api'

import {
  TerraDraw,
  TerraDrawCircleMode,
  TerraDrawPolygonMode,
  TerraDrawRectangleMode,
  TerraDrawSelectMode
} from 'terra-draw'

import { TerraDrawGoogleMapsAdapter } from 'terra-draw-google-maps-adapter'

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface LocationTypes {
  address_types: {
    [key: string]: string
  }
}

interface ErrorVal {
  name?: string
  address?: string
  address_type?: string
  shapeData?: string
  [key: string]: string | undefined
}

interface User {
  token: string
}

interface SessionData {
  user?: User
}

interface LocationForm {
  shapeData: string | null
  name: string
  address: string
  address_type: string
  tags: string
  note: string
}

type ShapeData =
  | {
      type: 'circle'
      center: {
        lat: number
        lng: number
      }
      radius: number
      area?: number
    }
  | {
      type: 'rectangle'
      bounds: {
        north: number
        east: number
        south: number
        west: number
      }
      area?: number
    }
  | {
      type: 'polygon'
      paths: Array<{
        lat: number
        lng: number
      }>
      area?: number
    }

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

const AddLocationModal: React.FC<{
  id: number | null
  close: any
  open: boolean
  updatedLocationData: () => void
}> = ({ id, close, open, updatedLocationData }) => {
  const router = useRouter()

  /* ------------------------------------------------------------------------ */
  /* State                                                                    */
  /* ------------------------------------------------------------------------ */

  const [locationField, setLocationField] = useState<LocationForm>({
    shapeData: null,
    name: '',
    address: '',
    address_type: '',
    tags: '',
    note: ''
  })

  const [isLoading, setIsLoading] = useState(false)

  const [editData, setEditData] = useState<any>(null)

  const [loctn, setLoctn] = useState<LocationTypes | null>(null)

  const [shapeDatas, setShapeData] = useState<string | null>(null)

  const [isDataLoading, setIsDataLoading] = useState(false)

  const [errors, setErrors] = useState<ErrorVal>({})

  const [map, setMap] = useState<google.maps.Map | null>(null)

  const drawRef = useRef<TerraDraw | null>(null)

  const mapRef = useRef<google.maps.Map | null>(null)

  const initializedEditShapeRef = useRef(false)

  /* ------------------------------------------------------------------------ */
  /* Map                                                                      */
  /* ------------------------------------------------------------------------ */

  const mapContainerStyle = {
    width: '100%',
    height: '400px'
  }

  /*
   * This is ONLY the initial map position.
   *
   * Do not pass this through `center={}` because that makes
   * GoogleMap controlled and can move the map back here
   * whenever React rerenders.
   */
  const mapCenter = useMemo(
    () => ({
      lat: 36.7378,
      lng: -119.7871
    }),
    []
  )

  const libraries: ('places' | 'geometry' | 'drawing')[] = useMemo(
    () => ['places', 'geometry', 'drawing'],
    []
  )

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!,
    libraries,
    id: 'google-map-scripts',
    version: 'weekly'
  })

  /* ------------------------------------------------------------------------ */
  /* Session                                                                  */
  /* ------------------------------------------------------------------------ */

  const { data: session } =
    (useSession() as {
      data?: SessionData
    }) || {}

  const token = session?.user?.token

  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL

  /* ------------------------------------------------------------------------ */
  /* Calculate polygon area                                                    */
  /* ------------------------------------------------------------------------ */

  const calculatePolygonArea = useCallback(
    (
      paths: Array<{
        lat: number
        lng: number
      }>
    ) => {
      if (!isLoaded || !google?.maps?.geometry?.spherical || paths.length < 3) {
        return 0
      }

      const latLngs = paths.map(
        point => new google.maps.LatLng(point.lat, point.lng)
      )

      return google.maps.geometry.spherical.computeArea(latLngs)
    },
    [isLoaded]
  )

  /* ------------------------------------------------------------------------ */
  /* Convert Terra Draw feature to ShapeData                                   */
  /* ------------------------------------------------------------------------ */

  const featureToShapeData = useCallback(
    (feature: any): ShapeData | null => {
      if (!feature?.geometry) {
        return null
      }

      const mode = feature?.properties?.mode

      const coordinates = feature.geometry.coordinates

      /* -------------------------------------------------------------------- */
      /* Circle                                                               */
      /* -------------------------------------------------------------------- */

      if (mode === 'circle') {
        if (feature.geometry.type !== 'Polygon' || !coordinates?.[0]) {
          return null
        }

        const ring = coordinates[0]

        if (!ring.length) {
          return null
        }

        let centerLat = 0
        let centerLng = 0

        const points = ring.slice(
          0,
          ring.length > 1 &&
            ring[0][0] === ring[ring.length - 1][0] &&
            ring[0][1] === ring[ring.length - 1][1]
            ? -1
            : undefined
        )

        if (!points.length) {
          return null
        }

        points.forEach(([lng, lat]: [number, number]) => {
          centerLng += lng
          centerLat += lat
        })

        centerLat /= points.length
        centerLng /= points.length

        const center = new google.maps.LatLng(centerLat, centerLng)

        let radius = 0

        points.forEach(([lng, lat]: [number, number]) => {
          const distance =
            google.maps.geometry.spherical.computeDistanceBetween(
              center,
              new google.maps.LatLng(lat, lng)
            )

          radius += distance
        })

        radius /= points.length

        return {
          type: 'circle',
          center: {
            lat: centerLat,
            lng: centerLng
          },
          radius,
          area: Math.PI * radius * radius
        }
      }

      /* -------------------------------------------------------------------- */
      /* Rectangle                                                            */
      /* -------------------------------------------------------------------- */

      if (mode === 'rectangle') {
        if (feature.geometry.type !== 'Polygon' || !coordinates?.[0]) {
          return null
        }

        const ring = coordinates[0]

        const points = ring.map(([lng, lat]: [number, number]) => ({
          lat,
          lng
        }))

        if (!points.length) {
          return null
        }

        const lats = points.map(point => point.lat)

        const lngs = points.map(point => point.lng)

        const north = Math.max(...lats)
        const south = Math.min(...lats)
        const east = Math.max(...lngs)
        const west = Math.min(...lngs)

        const area = calculatePolygonArea(points)

        return {
          type: 'rectangle',
          bounds: {
            north,
            east,
            south,
            west
          },
          area
        }
      }

      /* -------------------------------------------------------------------- */
      /* Polygon                                                              */
      /* -------------------------------------------------------------------- */

      if (mode === 'polygon') {
        if (feature.geometry.type !== 'Polygon' || !coordinates?.[0]) {
          return null
        }

        let paths = coordinates[0].map(([lng, lat]: [number, number]) => ({
          lat,
          lng
        }))

        /*
         * Remove GeoJSON closing coordinate.
         */
        if (paths.length > 1) {
          const first = paths[0]
          const last = paths[paths.length - 1]

          if (first.lat === last.lat && first.lng === last.lng) {
            paths = paths.slice(0, -1)
          }
        }

        if (paths.length < 3) {
          return null
        }

        return {
          type: 'polygon',
          paths,
          area: calculatePolygonArea(paths)
        }
      }

      return null
    },
    [calculatePolygonArea]
  )

  /* ------------------------------------------------------------------------ */
  /* ShapeData -> Terra Draw Feature                                           */
  /* ------------------------------------------------------------------------ */

  const shapeDataToFeature = useCallback((shapeData: ShapeData) => {
    if (!shapeData) {
      return null
    }

    /* -------------------------------------------------------------------- */
    /* Circle                                                               */
    /* -------------------------------------------------------------------- */

    if (shapeData.type === 'circle') {
      const { center, radius } = shapeData

      const numberOfPoints = 64

      const coordinates: [number, number][] = []

      const centerLatLng = new google.maps.LatLng(center.lat, center.lng)

      for (let i = 0; i <= numberOfPoints; i++) {
        const angle = (i / numberOfPoints) * 360

        const point = google.maps.geometry.spherical.computeOffset(
          centerLatLng,
          radius,
          angle
        )

        coordinates.push([point.lng(), point.lat()])
      }

      return {
        type: 'Feature',
        properties: {
          mode: 'circle'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates]
        }
      }
    }

    /* -------------------------------------------------------------------- */
    /* Rectangle                                                            */
    /* -------------------------------------------------------------------- */

    if (shapeData.type === 'rectangle') {
      const { north, east, south, west } = shapeData.bounds

      return {
        type: 'Feature',
        properties: {
          mode: 'rectangle'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [west, south],
              [east, south],
              [east, north],
              [west, north],
              [west, south]
            ]
          ]
        }
      }
    }

    /* -------------------------------------------------------------------- */
    /* Polygon                                                              */
    /* -------------------------------------------------------------------- */

    if (shapeData.type === 'polygon') {
      const coordinates = shapeData.paths.map(
        point => [point.lng, point.lat] as [number, number]
      )

      if (
        coordinates.length > 0 &&
        (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
          coordinates[0][1] !== coordinates[coordinates.length - 1][1])
      ) {
        coordinates.push(coordinates[0])
      }

      return {
        type: 'Feature',
        properties: {
          mode: 'polygon'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates]
        }
      }
    }

    return null
  }, [])

  /* ------------------------------------------------------------------------ */
  /* Get latest Terra Draw shape                                               */
  /* ------------------------------------------------------------------------ */

  const getLatestShapeData = useCallback((): string | null => {
    const draw = drawRef.current

    if (!draw) {
      return null
    }

    const features = draw.getSnapshot()

    if (!features || features.length === 0) {
      return null
    }

    const validFeatures = features.filter(
      (feature: any) =>
        feature?.geometry &&
        feature?.properties?.mode &&
        ['circle', 'rectangle', 'polygon'].includes(feature.properties.mode)
    )

    if (!validFeatures.length) {
      return null
    }

    const feature = validFeatures[validFeatures.length - 1]

    const latestShape = featureToShapeData(feature)

    if (!latestShape) {
      return null
    }

    return JSON.stringify(latestShape)
  }, [featureToShapeData])

  /* ------------------------------------------------------------------------ */
  /* Validation                                                               */
  /* ------------------------------------------------------------------------ */

  const validateForm = useCallback(
    (shapeDataOverride?: string | null) => {
      let isValid = true

      const validationErrors: ErrorVal = {}

      const currentShapeData = shapeDataOverride ?? locationField.shapeData

      /* -------------------------------------------------------------------- */
      /* Shape                                                                 */
      /* -------------------------------------------------------------------- */

      if (!currentShapeData || currentShapeData.trim() === '') {
        validationErrors.shapeData = 'Location map is required'

        isValid = false
      }

      /* -------------------------------------------------------------------- */
      /* Name                                                                  */
      /* -------------------------------------------------------------------- */

      if (!locationField.name || locationField.name.trim() === '') {
        validationErrors.name = 'Name is required'

        isValid = false
      } else {
        if (locationField.name.length > 60) {
          validationErrors.name = 'Name must be at most 60 characters long'

          isValid = false
        }

        if (!/^[A-Za-z\s]+$/i.test(locationField.name)) {
          validationErrors.name =
            'Name should be only alphabetic characters and spaces'

          isValid = false
        }
      }

      /* -------------------------------------------------------------------- */
      /* Address                                                               */
      /* -------------------------------------------------------------------- */

      if (!locationField.address || locationField.address.trim() === '') {
        validationErrors.address = 'Address is required'

        isValid = false
      } else if (locationField.address.length > 60) {
        validationErrors.address = 'Address must be at most 60 characters long'

        isValid = false
      }

      /* -------------------------------------------------------------------- */
      /* Address type                                                          */
      /* -------------------------------------------------------------------- */

      if (
        !locationField.address_type ||
        locationField.address_type.trim() === ''
      ) {
        validationErrors.address_type = 'Address type is required'

        isValid = false
      }

      setErrors(validationErrors)

      return isValid
    },
    [locationField]
  )

  /* ------------------------------------------------------------------------ */
  /* Field change                                                             */
  /* ------------------------------------------------------------------------ */

  const changeVehicleFieldHandler = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target

    setLocationField(prev => ({
      ...prev,
      [name]: value
    }))

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Fetch location types                                                     */
  /* ------------------------------------------------------------------------ */

  const fetchData = useCallback(async () => {
    if (!token || !url) {
      return
    }

    try {
      const response = await axios.get(`${url}/asset/location`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      setLoctn(response?.data || {})
    } catch (error) {
      console.error('Error fetching location data:', error)
    }
  }, [token, url])

  /* ------------------------------------------------------------------------ */
  /* Fetch edit data                                                          */
  /* ------------------------------------------------------------------------ */

  const fetchEditData = useCallback(async () => {
    if (!id || !token || !url) {
      return
    }

    try {
      const response = await axios.get(`${url}/asset/location/${id}/edit`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const { location } = response.data

      setEditData(location)

      const existingShapeData = location?.shapeData || null

      setShapeData(existingShapeData)

      setLocationField({
        name: location?.name || '',
        address: location?.address || '',
        address_type: location?.type || '',
        tags: location?.tags || '',
        note: location?.note || '',
        shapeData: existingShapeData
      })
    } catch (error) {
      console.error('Error fetching edit data:', error)
    }
  }, [id, token, url])

  /* ------------------------------------------------------------------------ */
  /* Initial loading                                                          */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!open || !token) {
      return
    }

    setIsDataLoading(false)

    const load = async () => {
      await Promise.all([fetchData(), id ? fetchEditData() : Promise.resolve()])

      setIsDataLoading(true)
    }

    load()
  }, [open, token, id, fetchData, fetchEditData])

  /* ------------------------------------------------------------------------ */
  /* Reset for Add mode                                                       */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!open) {
      initializedEditShapeRef.current = false

      return
    }

    if (!id) {
      initializedEditShapeRef.current = false

      setEditData(null)

      setShapeData(null)

      setLocationField({
        shapeData: null,
        name: '',
        address: '',
        address_type: '',
        tags: '',
        note: ''
      })

      setErrors({})
    }
  }, [open, id])

  /* ------------------------------------------------------------------------ */
  /* Map load / Terra Draw initialization                                     */
  /* ------------------------------------------------------------------------ */

  const onMapLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance)
      mapRef.current = mapInstance

      const initializeDrawing = () => {
        if (drawRef.current) return

        const draw = new TerraDraw({
          adapter: new TerraDrawGoogleMapsAdapter({
            map: mapInstance,
            lib: google.maps,
            coordinatePrecision: 9
          }),

          modes: [
            new TerraDrawCircleMode({
              drawInteraction: 'click-move-or-drag'
            }),

            new TerraDrawRectangleMode({
              drawInteraction: 'click-move-or-drag'
            }),

            new TerraDrawPolygonMode(),

            new TerraDrawSelectMode({
              flags: {
                circle: {
                  feature: {
                    draggable: true,
                    coordinates: {
                      draggable: true,
                      resizable: 'opposite'
                    }
                  }
                },

                rectangle: {
                  feature: {
                    draggable: true,
                    coordinates: {
                      draggable: true,
                      resizable: 'opposite'
                    }
                  }
                },

                polygon: {
                  feature: {
                    draggable: true,
                    coordinates: {
                      draggable: true,
                      midpoints: true
                    }
                  }
                }
              }
            })
          ]
        })

        drawRef.current = draw

        draw.start()

        draw.on('ready', () => {
          if (!id) {
            draw.setMode('circle')
          } else {
            draw.setMode('select')
          }
        })

        draw.on('change', features => {
          if (!features || features.length === 0) return

          const validFeatures = features.filter(
            (feature: any) =>
              feature?.geometry &&
              feature?.properties?.mode &&
              ['circle', 'rectangle', 'polygon'].includes(
                feature.properties.mode
              )
          )

          if (!validFeatures.length) return

          const feature = validFeatures[validFeatures.length - 1]

          const converted = featureToShapeData(feature)

          if (!converted) return

          const serialized = JSON.stringify(converted)

          setShapeData(serialized)

          setLocationField(prev => ({
            ...prev,
            shapeData: serialized
          }))

          setErrors(prev => ({
            ...prev,
            shapeData: undefined
          }))
        })
      }

      // Google Maps projection may not be ready immediately
      if (mapInstance.getProjection()) {
        initializeDrawing()
      } else {
        google.maps.event.addListenerOnce(
          mapInstance,
          'projection_changed',
          initializeDrawing
        )
      }
    },
    [featureToShapeData, id]
  )

  useEffect(() => {
    if (!open || !map || !isLoaded) return

    const timer = setTimeout(() => {
      google.maps.event.trigger(map, 'resize')
      map.setCenter(mapCenter)
      map.setZoom(10)
    }, 100)

    return () => clearTimeout(timer)
  }, [open, map, isLoaded, mapCenter])

  /* ------------------------------------------------------------------------ */
  /* Load existing shape                                                      */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!id || !editData || !map || !drawRef.current || !isLoaded) {
      return
    }

    if (initializedEditShapeRef.current) {
      return
    }

    if (!editData.shapeData) {
      initializedEditShapeRef.current = true

      return
    }

    try {
      const parsedShape = JSON.parse(editData.shapeData) as ShapeData

      const feature = shapeDataToFeature(parsedShape)

      if (!feature) {
        return
      }

      const draw = drawRef.current

      draw.clear()

      const result = draw.addFeatures([feature as any])

      console.log('Existing shape loaded into Terra Draw:', result)

      initializedEditShapeRef.current = true

      /* -------------------------------------------------------------------- */
      /* Fit bounds                                                            */
      /* -------------------------------------------------------------------- */

      const bounds = new google.maps.LatLngBounds()

      if (parsedShape.type === 'circle') {
        const center = new google.maps.LatLng(
          parsedShape.center.lat,
          parsedShape.center.lng
        )

        const northEast = google.maps.geometry.spherical.computeOffset(
          center,
          parsedShape.radius,
          45
        )

        const southWest = google.maps.geometry.spherical.computeOffset(
          center,
          parsedShape.radius,
          225
        )

        bounds.extend(northEast)

        bounds.extend(southWest)

        map.fitBounds(bounds)
      }

      if (parsedShape.type === 'rectangle') {
        bounds.extend(
          new google.maps.LatLng(
            parsedShape.bounds.north,
            parsedShape.bounds.east
          )
        )

        bounds.extend(
          new google.maps.LatLng(
            parsedShape.bounds.south,
            parsedShape.bounds.west
          )
        )

        map.fitBounds(bounds)
      }

      if (parsedShape.type === 'polygon') {
        parsedShape.paths.forEach(point => {
          bounds.extend(new google.maps.LatLng(point.lat, point.lng))
        })

        map.fitBounds(bounds)
      }

      draw.setMode('select')
    } catch (error) {
      console.error('Error loading existing shape:', error)
    }
  }, [id, editData, map, isLoaded, shapeDataToFeature])

  /* ------------------------------------------------------------------------ */
  /* Cleanup                                                                  */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    return () => {
      if (drawRef.current) {
        try {
          drawRef.current.stop()
        } catch (error) {
          console.error('Error stopping Terra Draw:', error)
        }

        drawRef.current = null
      }
    }
  }, [])

  /* ------------------------------------------------------------------------ */
  /* Change drawing mode                                                      */
  /* ------------------------------------------------------------------------ */

  const changeDrawingMode = useCallback(
    (mode: 'circle' | 'rectangle' | 'polygon') => {
      const draw = drawRef.current

      const currentMap = mapRef.current

      if (!draw || !currentMap) {
        return
      }

      /*
       * Save the current viewport.
       *
       * This prevents the map from jumping
       * back to the default location when
       * changing drawing modes.
       */
      const currentCenter = currentMap.getCenter()

      const currentZoom = currentMap.getZoom()

      /*
       * Remove previous shape.
       */
      draw.clear()

      setShapeData(null)

      setLocationField(prev => ({
        ...prev,
        shapeData: null
      }))

      setErrors(prev => ({
        ...prev,
        shapeData: undefined
      }))

      /*
       * Change drawing mode.
       */
      draw.setMode(mode)

      /*
       * Restore viewport.
       */
      if (currentCenter) {
        currentMap.setCenter(currentCenter)
      }

      if (currentZoom !== undefined) {
        currentMap.setZoom(currentZoom)
      }
    },
    []
  )

  /* ------------------------------------------------------------------------ */
  /* Clear shape                                                              */
  /* ------------------------------------------------------------------------ */

  const clearShape = useCallback(() => {
    if (drawRef.current) {
      drawRef.current.clear()
    }

    setShapeData(null)

    setLocationField(prev => ({
      ...prev,
      shapeData: null
    }))

    setErrors(prev => ({
      ...prev,
      shapeData: undefined
    }))
  }, [])

  /* ------------------------------------------------------------------------ */
  /* Submit API                                                               */
  /* ------------------------------------------------------------------------ */

  const handleFormSubmission = async (latestShapeData: string | null) => {
    if (!token || !url) {
      console.error('No authentication token available')

      return
    }

    const shapeData = latestShapeData || locationField.shapeData

    if (!shapeData) {
      setErrors(prev => ({
        ...prev,
        shapeData: 'Location map is required'
      }))

      return
    }

    setIsLoading(true)

    try {
      const apiUrl = id
        ? `${url}/asset/location/${id}`
        : `${url}/asset/location`

      const method = id ? 'put' : 'post'

      const response = await axios({
        method,
        url: apiUrl,
        data: {
          ...locationField,
          shapeData
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.status >= 200 && response.status < 300) {
        updatedLocationData()

        close(false)

        toast.success(`Location ${id ? 'updated' : 'added'} successfully!`, {
          position: 'top-right',
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        })

        router.push('/dashboard/assets/locations')
      } else {
        console.error('Failed to save/update:', response.data)
      }
    } catch (error: any) {
      console.error(
        'API error:',
        error?.response?.data || error?.message || error
      )

      toast.error(
        error?.response?.data?.message ||
          'Something went wrong while saving the location.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Form submit                                                              */
  /* ------------------------------------------------------------------------ */

  const onSubmitChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    /*
     * IMPORTANT:
     *
     * Read the shape directly from Terra Draw
     * before validation.
     *
     * React state updates asynchronously, so
     * relying only on locationField.shapeData
     * can cause "Location map is required".
     */
    const latestShapeData = getLatestShapeData() || locationField.shapeData

    /*
     * Validate using the latest shape.
     */
    if (!validateForm(latestShapeData)) {
      return
    }

    /*
     * Keep React state synchronized.
     */
    if (latestShapeData && latestShapeData !== locationField.shapeData) {
      setShapeData(latestShapeData)

      setLocationField(prev => ({
        ...prev,
        shapeData: latestShapeData
      }))
    }

    /*
     * Send the latest shape directly.
     * Do not wait for React state.
     */
    handleFormSubmission(latestShapeData)
  }

  /* ------------------------------------------------------------------------ */
  /* Close modal                                                              */
  /* ------------------------------------------------------------------------ */

  const handleClose = () => {
    clearShape()

    setErrors({})

    setIsLoading(false)

    close(false)
  }

  /* ------------------------------------------------------------------------ */
  /* Google Maps error                                                        */
  /* ------------------------------------------------------------------------ */

  if (loadError) {
    return (
      <div
        className={`modal ${open ? 'showpopup' : ''}`}
        style={{
          display: open ? 'block' : 'none'
        }}
        aria-modal='true'
        role='dialog'
      >
        <div className='modal-dialog modal-dialog-centered'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h2 className='fw-bold'>Location</h2>

              <button
                type='button'
                className='btn btn-icon btn-sm'
                onClick={handleClose}
              >
                <i className='ki ki-outline ki-cross fs-1' />
              </button>
            </div>

            <div className='modal-body'>
              <div className='alert alert-danger'>
                Unable to load Google Maps.
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* Loading skeleton                                                          */
  /* ------------------------------------------------------------------------ */

  if (!isDataLoading) {
    return (
      <div
        className={`modal ${open ? 'showpopup' : ''}`}
        style={{
          display: open ? 'block' : 'none'
        }}
        aria-modal='true'
        role='dialog'
      >
        <div className='modal-dialog modal-dialog-centered w-95 h-90 mw-650px mh-350px'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h2 className='fw-bold'>
                <Skeleton width={180} />
              </h2>

              <button
                type='button'
                className='btn btn-icon btn-sm btn-active-icon-primary'
                onClick={handleClose}
                aria-label='Close'
              >
                <i className='ki ki-outline ki-cross fs-1' />
              </button>
            </div>

            <div className='modal-body mx-5 mx-xl-15 my-7'>
              {Object.keys({
                shapeData: true,
                name: true,
                address: true,
                address_type: true,
                tags: true,
                note: true
              }).map(field => (
                <div className='fv-row mb-7' key={field}>
                  {field !== 'shapeData' && (
                    <label className='fs-6 fw-semibold form-label mb-2'>
                      <Skeleton width={120} />
                    </label>
                  )}

                  {field === 'shapeData' ? (
                    <Skeleton width='100%' height={400} />
                  ) : field === 'address' || field === 'note' ? (
                    <Skeleton width='100%' height={100} />
                  ) : (
                    <Skeleton width='100%' height={40} />
                  )}
                </div>
              ))}

              <div className='form-btn-grp w-100 text-center pt-10'>
                <Skeleton width={100} height={40} className='me-3' />

                <Skeleton width={100} height={40} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* Main UI                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <div
      className={`modal ${open ? 'showpopup' : ''}`}
      style={{
        display: open ? 'block' : 'none'
      }}
      aria-modal='true'
      role='dialog'
    >
      <div className='modal-dialog modal-dialog-centered w-95 h-90 mw-650px mh-350px'>
        <div className='modal-content'>
          {/* ---------------------------------------------------------------- */}
          {/* Header                                                            */}
          {/* ---------------------------------------------------------------- */}

          <div className='modal-header'>
            <h2 className='fw-bold'>{id ? 'Edit Location' : 'Add Location'}</h2>

            <button
              type='button'
              className='btn btn-icon btn-sm btn-active-icon-primary'
              onClick={handleClose}
              aria-label='Close'
            >
              <i className='ki ki-outline ki-cross fs-1' />
            </button>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Body                                                              */}
          {/* ---------------------------------------------------------------- */}

          <div className='modal-body mx-5 mx-xl-15 my-7'>
            <form
              id='kt_modal_add_location_form'
              className='form fv-plugins-bootstrap5 fv-plugins-framework'
              onSubmit={onSubmitChange}
            >
              {/* ============================================================ */}
              {/* MAP                                                          */}
              {/* ============================================================ */}

              <div className='fv-row mb-7'>
                <div
                  style={{
                    position: 'relative'
                  }}
                >
                  {isLoaded ? (
                    <>
                      <GoogleMap
                        center={mapCenter}
                        zoom={10}
                        mapContainerStyle={mapContainerStyle}
                        onLoad={onMapLoad}
                        options={{
                          mapTypeControl: false,
                          streetViewControl: false,
                          fullscreenControl: true
                        }}
                      />

                      {/* -------------------------------------------------- */}
                      {/* Drawing controls                                    */}
                      {/* -------------------------------------------------- */}

                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          zIndex: 1000,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          background: '#ffffff',
                          padding: 6,
                          borderRadius: 8,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      >
                        <button
                          type='button'
                          className='btn btn-outline-primary btn-sm'
                          onClick={() => changeDrawingMode('rectangle')}
                        >
                          Box
                        </button>

                        <button
                          type='button'
                          className='btn btn-outline-primary btn-sm'
                          onClick={() => changeDrawingMode('circle')}
                        >
                          Circle
                        </button>

                        <button
                          type='button'
                          className='btn btn-outline-primary btn-sm'
                          onClick={() => changeDrawingMode('polygon')}
                        >
                          Draw
                        </button>

                        <button
                          type='button'
                          className='btn btn-outline-danger btn-sm'
                          onClick={clearShape}
                        >
                          Clear
                        </button>
                      </div>
                    </>
                  ) : (
                    <Skeleton width='100%' height={400} />
                  )}
                </div>

                {errors.shapeData && (
                  <div
                    className='mt-2'
                    style={{
                      color: 'red'
                    }}
                  >
                    {errors.shapeData}
                  </div>
                )}
              </div>

              {/* ============================================================ */}
              {/* NAME                                                          */}
              {/* ============================================================ */}

              <div className='fv-row mb-7'>
                <label className='fs-6 fw-semibold form-label mb-2'>
                  <span className='required'>NAME</span>
                </label>

                <input
                  type='text'
                  className='form-control form-control-solid'
                  placeholder='Enter name'
                  name='name'
                  onChange={changeVehicleFieldHandler}
                  value={locationField.name}
                />

                {errors.name && (
                  <div
                    className='mt-2'
                    style={{
                      color: 'red'
                    }}
                  >
                    {errors.name}
                  </div>
                )}
              </div>

              {/* ============================================================ */}
              {/* ADDRESS                                                       */}
              {/* ============================================================ */}

              <div className='fv-row mb-7'>
                <label className='fs-6 fw-semibold form-label mb-2'>
                  <span className='required'>ADDRESS</span>
                </label>

                <textarea
                  className='form-control form-control-solid'
                  placeholder='Enter address'
                  name='address'
                  onChange={changeVehicleFieldHandler}
                  value={locationField.address}
                  rows={3}
                />

                {errors.address && (
                  <div
                    className='mt-2'
                    style={{
                      color: 'red'
                    }}
                  >
                    {errors.address}
                  </div>
                )}
              </div>

              {/* ============================================================ */}
              {/* ADDRESS TYPE                                                  */}
              {/* ============================================================ */}

              <div className='fv-row mb-7'>
                <label className='fs-6 fw-semibold form-label mb-2'>
                  <span className='required'>ADDRESS TYPE</span>
                </label>

                <div className='d-flex flex-wrap gap-3 mt-3 mb-2'>
                  {loctn?.address_types &&
                    Object.entries(loctn.address_types).map(([key, value]) => (
                      <div key={key} className='align-items-center d-flex'>
                        <input
                          className='form-check-input me-3 cursor-pointer'
                          name='address_type'
                          type='radio'
                          value={key}
                          id={`address-type-${key}`}
                          onChange={changeVehicleFieldHandler}
                          checked={locationField.address_type === key}
                        />

                        <label
                          className='form-check-label fs-6'
                          htmlFor={`address-type-${key}`}
                        >
                          {value}
                        </label>
                      </div>
                    ))}
                </div>

                {errors.address_type && (
                  <div
                    className='mt-2'
                    style={{
                      color: 'red'
                    }}
                  >
                    {errors.address_type}
                  </div>
                )}
              </div>

              {/* ============================================================ */}
              {/* TAGS                                                          */}
              {/* ============================================================ */}

              <div className='fv-row mb-7'>
                <label className='fs-6 fw-semibold form-label mb-2'>
                  <span>TAGS</span>
                </label>

                <input
                  type='text'
                  className='form-control form-control-solid'
                  placeholder='Enter tags'
                  name='tags'
                  onChange={changeVehicleFieldHandler}
                  value={locationField.tags}
                />
              </div>

              {/* ============================================================ */}
              {/* NOTE                                                          */}
              {/* ============================================================ */}

              <div className='fv-row mb-7'>
                <label className='fs-6 fw-semibold form-label mb-2'>
                  <span>NOTE</span>
                </label>

                <textarea
                  className='form-control form-control-solid'
                  placeholder='Enter note'
                  name='note'
                  onChange={changeVehicleFieldHandler}
                  value={locationField.note}
                  rows={3}
                />
              </div>

              {/* ============================================================ */}
              {/* BUTTONS                                                       */}
              {/* ============================================================ */}

              <div className='form-btn-grp w-100 text-center pt-10'>
                <button
                  type='button'
                  className='btn btn-light me-3'
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Discard
                </button>

                <button
                  type='submit'
                  id='kt_location_submit'
                  className='btn btn-primary'
                  disabled={isLoading}
                >
                  <span className='indicator-progress d-flex justify-content-center align-items-center'>
                    {isLoading ? (
                      <LoadingIcons.TailSpin height={18} />
                    ) : id ? (
                      'Update'
                    ) : (
                      'Save'
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddLocationModal
