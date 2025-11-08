import { Select } from './select'
import { Label } from './label'

interface DatePickerProps {
  value: string // ISO date format YYYY-MM-DD
  onChange: (value: string) => void
  id?: string
  required?: boolean
  label?: string
}

export function DatePicker({ value, onChange, id, required, label }: DatePickerProps) {
  // Parse the current value
  const parseDate = (dateStr: string) => {
    if (!dateStr) return { day: '', month: '', year: '' }
    const [year, month, day] = dateStr.split('-')
    return { day: day || '', month: month || '', year: year || '' }
  }

  const { day, month, year } = parseDate(value)

  // Generate years (from 1900 to current year)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i)

  // Days in month
  const getDaysInMonth = (m: string, y: string) => {
    if (!m || !y) return 31
    const monthNum = parseInt(m)
    const yearNum = parseInt(y)
    return new Date(yearNum, monthNum, 0).getDate()
  }

  const daysInMonth = getDaysInMonth(month, year)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ]

  const handleChange = (newDay: string, newMonth: string, newYear: string) => {
    if (newDay && newMonth && newYear) {
      const dateStr = `${newYear}-${newMonth.padStart(2, '0')}-${newDay.padStart(2, '0')}`
      onChange(dateStr)
    } else if (!newDay && !newMonth && !newYear) {
      onChange('')
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id}>
          {label} {required && <span className="text-danger-600">*</span>}
        </Label>
      )}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Select
            id={id ? `${id}-day` : undefined}
            value={day}
            onChange={(e) => handleChange(e.target.value, month, year)}
            required={required}
          >
            <option value="">Day</option>
            {days.map((d) => (
              <option key={d} value={d.toString().padStart(2, '0')}>
                {d}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Select
            id={id ? `${id}-month` : undefined}
            value={month}
            onChange={(e) => handleChange(day, e.target.value, year)}
            required={required}
          >
            <option value="">Month</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Select
            id={id ? `${id}-year` : undefined}
            value={year}
            onChange={(e) => handleChange(day, month, e.target.value)}
            required={required}
          >
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={y.toString()}>
                {y}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <p className="text-xs text-neutral-500">Select day, month, and year of birth</p>
    </div>
  )
}
