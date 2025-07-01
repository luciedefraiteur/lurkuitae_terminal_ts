import { exec, ExecException } from 'child_process';
import { osHint, OSContext } from './osHint.js';

type ExecCallback = (command: string, callback: (error: ExecException | null, stdout: string, stderr: string) => void) => void;

/**
 * Retourne la température CPU actuelle en degrés Celsius.
 * Retourne null si la température n'a pas pu être lue.
 */
export function getCpuTemperature(
  _exec: ExecCallback = exec,
  _osHint: typeof osHint = osHint
): Promise<number | null>
{
  switch (_osHint)
  {
    case OSContext.Unix:
      return getUnixCpuTemp(_exec);

    case OSContext.WindowsCmd:
      return getWindowsCmdCpuTemp(_exec);

    case OSContext.WindowsPowershell:
      return getWindowsPowershellCpuTemp(_exec);

    default:
      return Promise.resolve(null);
  }
}

function getUnixCpuTemp(_exec: ExecCallback): Promise<number | null>
{
  return new Promise((resolve) =>
  {
    _exec('sensors', (error, stdout, stderr) =>
    {
      if (error || stderr)
      {
        resolve(null);
        return;
      }

      const match = stdout.match(/Package id 0:\s+\+?([\d.]+)°C/);
      if (match)
      {
        resolve(parseFloat(match[1]));
      }
      else
      {
        resolve(null);
      }
    });
  });
}

function getWindowsCmdCpuTemp(_exec: ExecCallback): Promise<number | null>
{
  const cmd = 'wmic /namespace:\\root\wmi PATH MSAcpi_ThermalZoneTemperature get CurrentTemperature';

  return new Promise((resolve) =>
  {
    _exec(cmd, (error, stdout, stderr) =>

    {
      if (error || stderr)
      {
        resolve(null);
        return;
      }

      const match = stdout.match(/(\d+)/);
      if (match)
      {
        const kelvin = parseInt(match[1]);
        const celsius = Math.round((kelvin / 10) - 273.15);
        resolve(celsius);
      }
      else
      {
        resolve(null);
      }
    });
  });
}

function getWindowsPowershellCpuTemp(_exec: ExecCallback): Promise<number | null>
{
  const psCommand = 'Get-WmiObject MSAcpi_ThermalZoneTemperature -Namespace "root/wmi" | Select-Object -First 1 CurrentTemperature';

  return new Promise((resolve) =>
  {
    _exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) =>
    {
      if (error || stderr)
      {
        resolve(null);
        return;
      }

      const match = stdout.match(/(\d+)/);
      if (match)
      {
        const kelvin = parseInt(match[1]);
        const celsius = Math.round((kelvin / 10) - 273.15);
        resolve(celsius);
      }
      else
      {
        resolve(null);
      }
    });
  });
}
