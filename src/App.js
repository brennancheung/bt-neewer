import { Box, Container, Grid, Paper, Slider, Typography } from '@material-ui/core'
import { useRef, useEffect, useState } from 'react'
import { Brightness6Outlined, OpacityOutlined, PaletteOutlined } from '@material-ui/icons'
import './App.css'

// Hard coded for the NEEWER-RGB660
const SERVICE_UUID = '69400001-b5a3-f393-e0a9-e50e24dcca99'
const CHARACTERISTIC_UUID = '69400002-b5a3-f393-e0a9-e50e24dcca99'

const add = (a, b) => a + b
const sum = arr => arr.reduce(add)
const calcChecksum = values => (sum(values)) % 0x100

// const code = [0x78, 0x86, 0x04, 0xfb, 0x00, 0x3f, 0x35, 0x71]

const littleEndian16 = n => [
  (n % 0x100),
  (n & 0xFF00) >> 8,
]

export function useDebounce(callback, timeout, deps) {
  const timeoutId = useRef();

  useEffect(() => {
      clearTimeout(timeoutId.current);
      timeoutId.current = setTimeout(callback, timeout);

      return () => clearTimeout(timeoutId.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const ensureNum = x => typeof x === 'string' ? parseInt(x) : x

const generateCode = (...args) => {
  const [hue, sat, br] = args.map(ensureNum)
  const values = [0x78, 0x86, 0x04, ...littleEndian16(hue), sat, br]
  const checksum = calcChecksum(values)
  return [...values, checksum]
}

function App() {
  const [device, setDevice] = useState(null)
  const [characteristic, setCharacteristic] = useState(null)
  const [hue, setHue] = useState(0x30)
  const [saturation, setSaturation] = useState(50)
  const [brightness, setBrightness] = useState(80)

  useDebounce(() => {
    const code = generateCode(hue, saturation, brightness)
    const arr = new Uint8Array(code)
    console.log(arr)
    if (!characteristic) return
    return characteristic.writeValue(arr)
  }, 30, [hue, saturation, brightness])

  const fetchDevices = async () => {
    const result = await navigator.bluetooth.requestDevice({
      acceptAllDevices: false,
      filters: [
        { namePrefix: 'NEEWER' },
      ],
      optionalServices: [SERVICE_UUID],
    })
    setDevice(result)
    const server = await result.gatt.connect()
    const services = await server.getPrimaryServices()
    const service = services[0]
    const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID)
    setCharacteristic(characteristic)
  }

  const handleHue = (e, v) => setHue(parseInt(v))
  const handleSaturation = (e, v) => setSaturation(parseInt(v))
  const handleBrightness = (e, v) => setBrightness(parseInt(v))

  return (
    <div className="App">
      <br />
      <br />
      <Container maxWidth="xs">
        <Paper elevation={3}>
          <Box p={2}>
            <Typography gutterBottom>Hue {hue}</Typography>
            <Grid container spacing={2}>
              <Grid item xs={1}><PaletteOutlined /></Grid>
              <Grid item xs={1}>0</Grid>
              <Grid item xs={9}>
                <Slider min={0} max={360} value={hue} onChange={handleHue} />
              </Grid>
              <Grid item xs={1}>360</Grid>
            </Grid>
            <br />

            <Typography gutterBottom>Saturation {saturation}</Typography>
            <Grid container spacing={2}>
              <Grid item xs={1}><OpacityOutlined /></Grid>
              <Grid item xs={1}>0</Grid>
              <Grid item xs={9}>
                <Slider min={0} max={100} value={saturation} onChange={handleSaturation} />
              </Grid>
              <Grid item xs={1}>100</Grid>
            </Grid>
            <br />

            <Typography gutterBottom>Brightness {brightness}</Typography>
            <Grid container spacing={2}>
              <Grid item xs={1}><Brightness6Outlined /></Grid>
              <Grid item xs={1}>0</Grid>
              <Grid item xs={9}>
                <Slider min={0} max={100} value={brightness} onChange={handleBrightness} />
              </Grid>
              <Grid item xs={1}>100</Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>

      <br />
      <br />

      {!characteristic && <button onClick={fetchDevices}>Pair with light</button>}
      {characteristic && (
        <div>Connected to <code>{device?.name}</code></div>
      )}
    </div>
  );
}

export default App;
