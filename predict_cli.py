import argparse

from maternal_risk_fuzzy.predictor import predict_single_case


def build_parser():
    parser = argparse.ArgumentParser(
        description="Predice el riesgo materno desde la linea de comandos."
    )
    parser.add_argument("--age", type=float, help="Edad en anos.")
    parser.add_argument("--systolicbp", type=float, help="Presion sistolica en mmHg.")
    parser.add_argument("--diastolicbp", type=float, help="Presion diastolica en mmHg.")
    parser.add_argument("--bs", type=float, help="Glucosa en sangre en mmol/L.")
    parser.add_argument("--bodytemp", type=float, help="Temperatura corporal en F.")
    parser.add_argument("--heartrate", type=float, help="Frecuencia cardiaca en bpm.")
    parser.add_argument(
        "--system",
        choices=["optimized", "base"],
        default="optimized",
        help="Sistema a usar para la prediccion.",
    )
    return parser


def ask_value(label):
    return float(input(f"{label}: ").strip())


def collect_inputs(args):
    return {
        "Age": args.age if args.age is not None else ask_value("Age"),
        "SystolicBP": (
            args.systolicbp if args.systolicbp is not None else ask_value("SystolicBP")
        ),
        "DiastolicBP": (
            args.diastolicbp
            if args.diastolicbp is not None
            else ask_value("DiastolicBP")
        ),
        "BS": args.bs if args.bs is not None else ask_value("BS"),
        "BodyTemp": (
            args.bodytemp if args.bodytemp is not None else ask_value("BodyTemp")
        ),
        "HeartRate": (
            args.heartrate if args.heartrate is not None else ask_value("HeartRate")
        ),
    }


def main():
    parser = build_parser()
    args = parser.parse_args()
    input_values = collect_inputs(args)
    prediction = predict_single_case(input_values, system_name=args.system)

    print("Prediccion de riesgo materno")
    print("-" * 50)
    print(f"Sistema usado: {prediction['system_name']}")
    print(f"Origen de membresias: {prediction['memberships_source']}")
    print(f"RiskScore: {prediction['score']:.4f}")
    print(f"Riesgo: {prediction['label']}")


if __name__ == "__main__":
    main()
