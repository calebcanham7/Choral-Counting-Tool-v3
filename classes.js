export { CustomTable, Fraction, Polynomial }

// class CustomTable {
//   constructor(data, rows, cols) {
//     this.data = data;
//     this.rows = rows;
//     this.cols = cols;
//   }

//   render(containerId, direction = "across", font = "") {
//     const container = document.getElementById(containerId);
//     if (!container) {
//       console.error(`Container with ID "${containerId}" not found.`);
//       return;
//     }

//     const table = document.createElement('table');
//     table.style.borderCollapse = 'collapse';
//     table.style.width = '100%';

//     for (let r = 0; r < this.rows; r++) {
//       const tr = document.createElement('tr');

//       for (let c = 0; c < this.cols; c++) {
//         const td = document.createElement('td');
//         let index;

//         if (direction === "down") {
//           index = c * this.rows + r; // column-major order
//         } else {
//           index = r * this.cols + c; // row-major order
//         }

//         td.textContent = this.data[index] ?? '';
//         td.style.border = 'none';
//         td.style.padding = '32px';
//         td.style.textAlign = 'center';
//         tr.appendChild(td);
//       }

//       table.appendChild(tr);
//     }

//     container.innerHTML = '';
//     container.appendChild(table);
//   }
// }

class CustomTable {
  constructor(data, rows, cols) {
    this.data = data;
    this.rows = rows;
    this.cols = cols;
    this.revealIndex = 0; // tracks how many cells are visible
    this.direction = "across"; // default direction
  }

  render(containerId, direction = "across", font = "Arial", fontSize = 18) {
    this.containerId = containerId;
    this.direction = direction;
    this.revealIndex = 0;
    this.font = font
    this.fontSize = fontSize
    this._renderTable();
  }

  progressiveRender(action) {
    if (!this.containerId) {
      console.error("Table must be rendered first.");
      return;
    }

    if (action === "start") {
      this.revealIndex = 1;
    } else if (action === "next") {
      if (this.revealIndex < this.data.length) {
        this.revealIndex++;
      }
    } else if (action === "back") {
      if (this.revealIndex > 1) {
        this.revealIndex--;
      }
    } else if (action === "restart") {
      this.revealIndex = 1;
    } else if (action === "reveal") {
      this.revealIndex = this.data.length;
    }

    this._renderTable();
  }

  _renderTable() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container with ID "${this.containerId}" not found.`);
      return;
    }

    const table = document.createElement('table');
    table.style.tableLayout = 'fixed';
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.fontFamily = this.font; // or 'Georgia', 'Courier New', etc.
    table.style.fontSize = `${this.fontSize}px`; // or '1em', '1.2rem', etc.

    // helpers
    const escapeHtml = (s) => String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    // Replace ^... with superscript. Supports numbers, simple identifiers, and parenthesized expressions.
    const replaceCaretWithSup = (s) => {
      // operate on escaped text so we don't allow raw HTML injection
      const esc = escapeHtml(s);
      return esc.replace(/\^(-?\d+|\([^\)]+\)|[a-zA-Z]+)/g, (m, grp) => {
        return `<sup>${grp}</sup>`;
      });
    };

    for (let r = 0; r < this.rows; r++) {
      const tr = document.createElement('tr');

      for (let c = 0; c < this.cols; c++) {
        const td = document.createElement('td');
        let index = this.direction === "down"
          ? c * this.rows + r
          : r * this.cols + c;

        const visible = index < this.revealIndex;
        const raw = visible ? this.data[index] ?? '' : '';

        // Helper to create stacked fraction HTML (whole number stays to the left)
        const makeFractionHTML = (whole, fracPart) => {
          let html = '<div style="display:flex; align-items:center; justify-content:center;">';
          if (whole !== '') {
            html += `<span style="margin-right:8px;">${escapeHtml(whole)}</span>`;
          }
          if (fracPart !== '') {
            const [num, den] = fracPart.split('/');
            html +=
              `<span style="display:inline-block; text-align:center; line-height:1; min-width:28px;">` +
              `<span style="display:block;">${escapeHtml(num)}</span>` +
              `<span style="display:block; border-top:1px solid currentColor; margin:3px 0;"></span>` +
              `<span style="display:block;">${escapeHtml(den)}</span>` +
              `</span>`;
          }
          html += '</div>';
          return html;
        };

        // Determine how to render the cell
        if (raw === '' || raw === null || raw === undefined) {
          td.textContent = '';
        } else {
          // Fraction instance
          const isFractionInstance = (typeof Fraction !== 'undefined') && (raw instanceof Fraction);
          // String that looks like a fraction or mixed number: "a/b" or "w a/b"
          const isFractionString = (typeof raw === 'string') && /\d+\/\d+/.test(raw);

          if (isFractionInstance) {
            const mixed = raw.toString('mixed'); // ensures whole number separated if present
            if (mixed.includes(' ')) {
              const [whole, fracPart] = mixed.split(' ');
              td.innerHTML = makeFractionHTML(whole, fracPart);
            } else if (mixed.includes('/')) {
              td.innerHTML = makeFractionHTML('', mixed);
            } else {
              // whole number only
              // allow superscript processing if somehow present (though fractions typically don't)
              td.innerHTML = replaceCaretWithSup(String(mixed));
            }
          } else if (isFractionString) {
            const str = String(raw).trim();
            if (str.includes(' ')) {
              const [whole, fracPart] = str.split(' ');
              td.innerHTML = makeFractionHTML(whole, fracPart);
            } else if (str.includes('/')) {
              td.innerHTML = makeFractionHTML('', str);
            } else {
              td.innerHTML = replaceCaretWithSup(str);
            }
          } else {
            // generic value (could be Polynomial or plain string/number). Convert to string then replace carets.
            const str = (raw && typeof raw.toString === 'function') ? raw.toString() : String(raw);
            td.innerHTML = replaceCaretWithSup(str);
          }
        }

        td.style.border = 'none';
        td.style.padding = '32px';
        td.style.textAlign = 'center';
        tr.appendChild(td);
      }

      table.appendChild(tr);
    }

    container.innerHTML = '';
    container.appendChild(table);
  }
}

class Fraction {
  constructor(numerator, denominator) {
    if (denominator === 0) {
      throw new Error('Denominator cannot be zero.');
    }
    this.numerator = numerator;
    this.denominator = denominator;
    this.simplify();
  }

  getNumerator() {
    return this.numerator;
  }

  getDenominator() {
    return this.denominator;
  }

toString(format = 'improper') {
  if (this.denominator === 1) {
    return this.numerator.toString()
  }

  if (format === 'mixed') {
    const whole = Math.floor(this.numerator / this.denominator);
    let remainder = this.numerator % this.denominator;

    if (remainder === 0) {
      return `${whole}`; // It's a whole number
    } else if (whole === 0) {
      return `${remainder}/${this.denominator}`; // Proper fraction
    } else {
      if (whole < 0 || remainder < 0){
        remainder = Math.abs(remainder)
      }
      return `${whole} ${remainder}/${this.denominator}`; // Mixed number
    }
  }



  // Default: improper fraction
  return `${this.numerator}/${this.denominator}`;
}

normalizeFraction() {
  if (this.denominator < 0) {
    this.numerator = -this.numerator;
    this.denominator = -this.denominator;
  }
}


//   add(other) {
//     if (!(other instanceof Fraction)) {
//         other = new Fraction(other, 1);
//     }
//     const newNumerator = this.numerator * other.denominator + other.numerator * this.denominator;
//     const newDenominator = this.denominator * other.denominator;
//     return new Fraction(newNumerator, newDenominator);
//   }

//   subtract(other) {
//     if (!(other instanceof Fraction)) {
//         other = new Fraction(other, 1);
//     }
//     const newNumerator = this.numerator * other.denominator - other.numerator * this.denominator;
//     const newDenominator = this.denominator * other.denominator;
//     return new Fraction(newNumerator, newDenominator);
//   }

  simplify() {
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(this.numerator, this.denominator);
    this.numerator /= divisor;
    this.denominator /= divisor;
    this.normalizeFraction()
  }
}

class Polynomial {
  // input: string like "3x^2-2x+1" or array of coefficients (descending: [a_n,...,a0])
  // or a number n to create zero polynomial of degree n. optional degree param forces size (degree n).
  // Now supports arbitrary single-letter variables (e.g. "n^2+2", "3t+2"). If no variable present, defaults to 'x'.
  // New: optional third parameter 'variable' allows preserving/displaying a particular variable when constructing from arrays/numbers.
  constructor(input = '0', degree, variable) {
    if (Array.isArray(input)) {
      this.coefficients = input.slice();
      // do not force a default variable for pure coefficient arrays
      this.variable = variable ?? null;
    } else if (typeof input === 'string') {
      const parsed = Polynomial._parseString(input);
      this.coefficients = parsed.coeffs;
      // prefer explicit variable param if provided, else parsed variable or default 'x'
      this.variable = variable ?? parsed.variable ?? null;
      // debug: log when constructing from string to trace variable detection
      try {
        if (typeof console !== 'undefined' && console.debug) console.debug(`Polynomial parsed from string '${input}' -> variable='${this.variable}', coeffs=${JSON.stringify(this.coefficients)}`);
      } catch (e) {
        // ignore logging errors in restricted environments
      }
    } else if (typeof input === 'number') {
      const n = Math.max(0, Math.floor(input));
      this.coefficients = new Array(n + 1).fill(0);
      this.variable = variable ?? null;
    } else {
      this.coefficients = [0];
      this.variable = variable ?? null;
    }

    if (typeof degree === 'number') {
      const targetLen = Math.max(1, Math.floor(degree) + 1);
      if (this.coefficients.length < targetLen) {
        const pad = new Array(targetLen - this.coefficients.length).fill(0);
        this.coefficients = pad.concat(this.coefficients);
      } else if (this.coefficients.length > targetLen) {
        // trim highest-degree terms to fit "up to degree n"
        this.coefficients = this.coefficients.slice(this.coefficients.length - targetLen);
      }
    }

    this._trim();
  }

  static _parseString(str) {
    str = String(str).replace(/\s+/g, '').toLowerCase();
    if (str === '') return { coeffs: [0], variable: 'x' };
    if (!/^[+-]/.test(str)) str = '+' + str;

    // detect a variable letter (first alphabetic character) if any
    const varMatch = str.match(/[a-z]/);
    const variable = varMatch ? varMatch[0] : null;

    const termPattern = /[+-][^+-]+/g;
    const terms = str.match(termPattern) || [];
    const coeffsMap = new Map();
    let maxPower = 0;

    for (const term of terms) {
      const sign = term[0] === '-' ? -1 : 1;
      const body = term.slice(1);

      if (variable && body.includes(variable)) {
        // coefficient part before the variable letter
        const beforeVar = body.split(variable)[0];
        // handle implied coeffs: '' => 1
        const coeffNum = (beforeVar === '' || beforeVar === '+') ? 1 : (beforeVar === '-' ? -1 : parseFloat(beforeVar));
        // power detection like 'x^3' or default 1
        const powerMatch = body.match(new RegExp(`${variable}\\^(\\d+)$`));
        const power = powerMatch ? parseInt(powerMatch[1], 10) : 1;
        maxPower = Math.max(maxPower, power);
        coeffsMap.set(power, (coeffsMap.get(power) || 0) + sign * coeffNum);
      } else {
        // constant term (no variable)
        const val = parseFloat(body);
        coeffsMap.set(0, (coeffsMap.get(0) || 0) + sign * val);
        maxPower = Math.max(maxPower, 0);
      }
    }

    const arr = [];
    for (let p = maxPower; p >= 0; p--) arr.push(coeffsMap.get(p) || 0);
    return { coeffs: arr.length ? arr : [0], variable: variable || null };
  }

  _trim() {
    // remove leading zeros, but leave single zero if polynomial is zero
    while (this.coefficients.length > 1 && Math.abs(this.coefficients[0]) === 0) {
      this.coefficients.shift();
    }
  }

  degree() {
    return this.coefficients.length - 1;
  }

  toString() {
    const varName = this.variable || 'x';
    // debug: log when converting to string to verify variable used
    try {
      if (typeof console !== 'undefined' && console.debug) console.debug(`Polynomial.toString() variable='${varName}', coeffs=${JSON.stringify(this.coefficients)}`);
    } catch (e) {
      // ignore
    }
    const deg = this.degree();
    if (deg === 0) return String(this.coefficients[0] || 0);

    const parts = [];
    for (let i = 0; i < this.coefficients.length; i++) {
      const coeff = this.coefficients[i];
      const power = deg - i;
      if (coeff === 0) continue;

      const sign = coeff < 0 ? '-' : '+';
      const absVal = Math.abs(coeff);

      let coeffStr = '';
      if (power === 0) {
        coeffStr = String(absVal);
      } else if (absVal === 1) {
        coeffStr = ''; // omit '1' for x terms
      } else {
        coeffStr = String(absVal);
      }

      let term;
      if (power === 0) term = coeffStr;
      else if (power === 1) term = `${coeffStr}${varName}`;
      else term = `${coeffStr}${varName}^${power}`;

      parts.push((parts.length === 0 && sign === '+') ? term : `${sign}${term}`);
    }

    return parts.length ? parts.join('') : '0';
  }

  // ensure polynomial instance (numbers become constant polynomials, strings parsed, arrays passed through)
  static _asPoly(p) {
    if (p instanceof Polynomial) return p;
    if (typeof p === 'number') return new Polynomial([p]); // numeric constant -> coefficients array [p]
    return new Polynomial(p);
  }

  // align coefficients arrays (descending) and return [aCoeffs, bCoeffs]
  static _align(a, b) {
    const la = a.length, lb = b.length;
    if (la === lb) return [a.slice(), b.slice()];
    if (la > lb) {
      const pad = new Array(la - lb).fill(0);
      return [a.slice(), pad.concat(b)];
    } else {
      const pad = new Array(lb - la).fill(0);
      return [pad.concat(a), b.slice()];
    }
  }

  add(other) {
    other = Polynomial._asPoly(other);
    const [A, B] = Polynomial._align(this.coefficients, other.coefficients);
    const res = A.map((v, i) => v + B[i]);
    // preserve variable by passing it into the constructor
    const out = new Polynomial(res, undefined, this.variable || other.variable || 'x');
    return out;
  }

  subtract(other) {
    other = Polynomial._asPoly(other);
    const [A, B] = Polynomial._align(this.coefficients, other.coefficients);
    const res = A.map((v, i) => v - B[i]);
    const out = new Polynomial(res, undefined, this.variable || other.variable || 'x');
    return out;
  }

  // optional: evaluate at x (numerical)
  evaluate(x) {
    let val = 0;
    for (let i = 0; i < this.coefficients.length; i++) {
      val = val * x + this.coefficients[i];
    }
    return val;
  }
}