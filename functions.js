import { Fraction, Polynomial } from './classes.js'
export { generateData }

const generateData = (init, int, op, type, len, frac, dec) => {
    // console.log('generateData params:', {init, int, op, type, len})
    const arr = [init]
    for(let i = 0; i < len-1; i++){
        arr.push(nextData(arr[i], int, op, type, frac, dec))
    }
    if (type === "Fraction" && frac === "mixed") {
        for(let i = 0; i < arr.length; i++) {
            let temp = arr[i]
            if (temp.includes("/")){
                let tempsplit = temp.split("/")
                let tempfrac = new Fraction(tempsplit[0], tempsplit[1])
                arr[i] = tempfrac.toString("mixed")
            }
        }
    }
    return arr
}

const nextData = (current, change, operation, numType, fracType = "improper", decType = false) => {
    // console.log('nextData params:', { current, change, operation, numType })
    let nextPoint = undefined
    switch(numType){
        case "Integer":
        case "Decimal":

            const origCurrentStr = current
            const origChangeStr = change
            current = Number(current)
            change = Number(change)

            nextPoint = operation === "+" ? current + change : current - change

            if (numType === "Decimal") {
                // get original argument strings (arguments[...] still holds the original passed values)
                // const origCurrentStr = String(arguments[0])
                // const origChangeStr = String(arguments[1])

                // avoid floating point noise
                nextPoint = Math.round(nextPoint * 1000) / 1000

                const countDecimals = s => {
                    const str = String(s)
                    if (str.includes('.')) return str.split('.')[1].length
                    return 0
                }

                // number of decimal places to show (cap at 3 because we rounded to 3)
                const dPlaces = Math.min(3, Math.max(countDecimals(origCurrentStr), countDecimals(origChangeStr)))

                if (decType) {
                    // pad so every returned decimal in the sequence has the same length
                    return nextPoint.toFixed(dPlaces)
                } else {
                    // minimal representation (trim trailing zeros and optional dot)
                    return nextPoint.toFixed(dPlaces).replace(/\.?0+$/, '')
                }
            }
            break

        case "Fraction":
            
            if (current.includes("/")) {
                const currentSplit = current.split("/")
                current = new Fraction(currentSplit[0], currentSplit[1])
            }
            if (change.includes("/")) {
                const changeSplit = change.split("/")
                change = new Fraction(changeSplit[0], changeSplit[1])
            }

            nextPoint = operation === "+" ? fractionAdd(current, change) : fractionSubtract(current, change)
            break

        case "Polynomial":

            current = new Polynomial(current)
            change = new Polynomial(change)

            nextPoint = operation === "+" ? addPoly(current, change) : subtractPoly(current, change)
            break

    }
    // if (numType === "Fraction" && fracType === "mixed") {
    //     return nextPoint.toString("mixed")
    // }
    return nextPoint.toString()
}

const fractionAdd = (frac1, frac2) => {
    if (!(frac1 instanceof Fraction)) {
        frac1 = new Fraction(frac1, 1);
    }
    if (!(frac2 instanceof Fraction)) {
        frac2 = new Fraction(frac2, 1);
    }
    const newNumerator = frac1.numerator * frac2.denominator + frac2.numerator * frac1.denominator;
    const newDenominator = frac1.denominator * frac2.denominator;
    return new Fraction(newNumerator, newDenominator);
}

const addPoly = (p1, p2) => {
    if (!(p1 instanceof Polynomial)) p1 = new Polynomial(p1)
    if (!(p2 instanceof Polynomial)) p2 = new Polynomial(p2)
    return p1.add(p2)
}

const subtractPoly = (p1, p2) => {
    if (!(p1 instanceof Polynomial)) p1 = new Polynomial(p1)
    if (!(p2 instanceof Polynomial)) p2 = new Polynomial(p2)
    return p1.subtract(p2)
}
