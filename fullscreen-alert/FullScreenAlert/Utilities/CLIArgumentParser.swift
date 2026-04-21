import Foundation

struct CLIArgumentParser {
    static func parse() -> AlertParameters? {
        let args = CommandLine.arguments
        guard args.count > 1 else { return nil }

        let defaults = AlertParameters.loadDefaults()
        var title = defaults.title
        var message = defaults.message
        var colorHex = defaults.colorHex

        var i = 1
        while i < args.count {
            switch args[i] {
            case "--title":
                if i + 1 < args.count {
                    i += 1
                    title = args[i]
                }
            case "--message":
                if i + 1 < args.count {
                    i += 1
                    message = args[i]
                }
            case "--color":
                if i + 1 < args.count {
                    i += 1
                    colorHex = args[i]
                }
            default:
                break
            }
            i += 1
        }

        return AlertParameters(
            title: title,
            message: message,
            colorHex: colorHex,
            displayTarget: defaults.displayTarget
        )
    }
}
