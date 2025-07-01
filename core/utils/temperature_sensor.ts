import { exec } from 'child_process';
import { osHint, OSContext } from './osHint.js';

/**
 * Retourne la température CPU actuelle en degrés Celsius.
 * Retourne null si la température n'a pas pu être lue.
 */
export function getCpuTemperature(): Promise<number | null>
{
  switch (osHint)
  {
    case OSContext.Unix:
      return getUnixCpuTemp();

    case OSContext.WindowsCmd:
      return getWindowsCmdCpuTemp();

    case OSContext.WindowsPowershell:
      return getWindowsPowershellCpuTemp();

    default:
      return Promise.resolve(null);
  }
}

function getUnixCpuTemp(): Promise<number | null>
{
  return new Promise((resolve) =>
  {
    exec('sensors', (error, stdout, stderr) =>
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

function getWindowsCmdCpuTemp(): Promise<number | null>
{
  const cmd = 'wmic /namespace:\\\\root\\wmi PATH MSAcpi_ThermalZoneTemperature get CurrentTemperature';

  return new Promise((resolve) =>
  {
    exec(cmd, (error, stdout, stderr) =>
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

function getWindowsPowershellCpuTemp(): Promise<number | null>
{
  const psCommand = 'Get-WmiObject MSAcpi_ThermalZoneTemperature -Namespace "root/wmi" | Select-Object -First 1 CurrentTemperature';

  return new Promise((resolve) =>
  {
    exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) =>
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
