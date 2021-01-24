import _data from './longer.json'

const BTATT_OPCODE_WRITE = '0x00000052'
const BTATT_HANDLE = '0x0000000e'

const data = _data
  .map(x => x._source.layers.btatt)
  .filter(x => x['btatt.handle'] === BTATT_HANDLE)
  .filter(x => x['btatt.opcode'] === BTATT_OPCODE_WRITE)
  .filter(x => false)

const parseValues = str => {
  const values = str.split(':').map(hexStr => parseInt(hexStr, 16))
  const checksum = values.pop()
  return { values, checksum }
}

const zeroPad = str => str.length < 2 ? '0' + str : str
const asHex = n => zeroPad(n.toString(16))

const renderValues = values => <code>{values.map(asHex).join(' ')}</code>
const renderChecksum = values => asHex(calcChecksum(values))
const calcDelta = (a, b) => {
  const pa = parseInt(a, 16)
  const pb = parseInt(b, 16)
  if (pa === pb) return '0'
  if (pa > pb) return '+' + (pa - pb)
  return '-' + (pa - pb + 0x100)
}

const renderRow = (row, idx) => {
  const { values, checksum } = parseValues(row['btatt.value'])
  return (
    <tr key={idx}>
      <td>{renderValues(values)}</td>
      <td>{renderChecksum(values)}</td>
      <td>{asHex(checksum)}</td>
      <td>{calcDelta(renderChecksum(values), asHex(checksum))}</td>
    </tr>
  )
}

export const DataViewer = () => {
      return (
        <table>
            <thead>
            <tr>
                <th>Value</th>
                <th>Checksum</th>
                <th>Actual</th>
                <th>Delta</th>
            </tr>
            </thead>
            <tbody>
            {data.map(renderRow)}
            </tbody>
        </table>
      )
  }